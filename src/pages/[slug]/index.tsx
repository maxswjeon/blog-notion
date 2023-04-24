import { GetStaticPaths, GetStaticProps } from "next";
import { NotionAPI } from "notion-client";
import { CollectionPropertySchemaMap, CollectionViewBlock } from "notion-types";
import { getTextContent, parsePageId } from "notion-utils";
import { NotionRenderer } from "react-notion-x";
import { PageData, getDirectChild, getMainPage } from "utils/notion";

type Props = {
  contentJson: string;
};

type Params = {
  slug: string;
};

export default function BlogPage({ contentJson }: Props) {
  const content = JSON.parse(contentJson);

  return (
    <div className="mt-16">
      <NotionRenderer recordMap={content} fullPage disableHeader />
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props, Params> = async ({
  params,
}) => {
  const notion = new NotionAPI({
    activeUser: process.env.NOTION_ACTIVE_USER,
    authToken: process.env.NOTION_AUTH_TOKEN,
  });

  const slug = params?.slug;

  if (!slug) {
    return {
      props: {
        slug: "",
        contentJson: "",
      },
    };
  }

  const id = slug.split("-").slice(-1)[0];
  const content = await notion.getPage(id);

  return {
    props: { slug, contentJson: JSON.stringify(content) },
    revalidate: 10 * 60, // 10 minutes
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const pageId = parsePageId(process.env.NOTION_PAGE_URL);

  const notion = new NotionAPI({
    activeUser: process.env.NOTION_ACTIVE_USER,
    authToken: process.env.NOTION_AUTH_TOKEN,
  });

  const recordMap = await notion.getPage(pageId);

  const databaseView = getDirectChild(
    recordMap,
    "collection_view"
  ) as CollectionViewBlock[];

  if (
    databaseView.length === 0 ||
    databaseView[0].collection_id === undefined
  ) {
    return {
      paths: [],
      fallback: false,
    };
  }

  const databaseId = databaseView[0].collection_id;
  const databaseMap = await notion.getCollectionData(
    databaseId,
    databaseView[0].view_ids[0],
    databaseView[0],
    { loadContentCover: true }
  );

  const postIds: string[] =
    // @ts-expect-error: Something's wrong here
    databaseMap.result.reducerResults.collection_group_results.blockIds;

  const schema: CollectionPropertySchemaMap =
    // @ts-expect-error: Something's wrong here
    databaseMap.recordMap.collection[databaseId].value.schema;

  const pathColumnId = Object.keys(schema).find(
    (key) => schema[key].name === "Path"
  );

  const postDataPromise = await Promise.allSettled(
    postIds.map(async (id) => ({ id, data: await notion.getPage(id) }))
  );
  const postDataFiltered = postDataPromise.filter(
    (p) => p.status !== "rejected"
  ) as PromiseFulfilledResult<PageData>[];
  const postData = postDataFiltered.map(
    (p: PromiseFulfilledResult<PageData>) => p.value
  );

  const paths = postData
    .map((data) => {
      const mainPage = getMainPage(data.data);
      if (!mainPage || !mainPage.properties) {
        return null;
      }

      if (!pathColumnId || !(pathColumnId in mainPage.properties)) {
        return null;
      }

      const pageId = mainPage.id.replaceAll("-", "");
      //@ts-expect-error: PageBlock.properties is not well typed
      const slug = getTextContent(mainPage.properties[pathColumnId]);
      return {
        params: {
          slug: `${slug}-${pageId}`,
        },
      };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return {
    paths,
    fallback: false,
  };
};
