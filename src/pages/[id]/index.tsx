import { GetStaticPaths, GetStaticProps } from "next";
import { NotionAPI } from "notion-client";
import { CollectionViewBlock } from "notion-types";
import { parsePageId } from "notion-utils";
import { NotionRenderer } from "react-notion-x";
import { getDirectChild, getMainPage, getPostData } from "utils/notion";

type Props = {
  contentJson: string;
};

type Params = {
  id: string;
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

  const id = params?.id;

  if (!id) {
    return {
      props: {
        slug: "",
        contentJson: "",
      },
    };
  }

  const content = await notion.getPage(id);

  return {
    props: { id, contentJson: JSON.stringify(content) },
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

  const postData = await getPostData(notion, databaseMap);

  const paths = postData
    .map((data) => {
      const mainPage = getMainPage(data.data);

      if (!mainPage) {
        return null;
      }

      const pageId = mainPage.id.replaceAll("-", "");
      return {
        params: {
          id: pageId,
        },
      };
    })
    .filter(Boolean) as { params: { id: string } }[];

  return {
    paths,
    fallback: false,
  };
};
