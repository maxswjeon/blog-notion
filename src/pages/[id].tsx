import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { NotionAPI } from "notion-client";
import { CollectionViewBlock } from "notion-types";
import { getTextContent, parsePageId } from "notion-utils";
import { NotionRenderer } from "react-notion-x";
import {
  getColumnData,
  getDirectChild,
  getMainPage,
  getPostData,
  getSchema,
} from "utils/notion";

type Props = {
  contentJson: string;
  title?: string;
  mainTitle?: string;
};

type Params = {
  id: string;
};

export default function BlogPage({ contentJson, title, mainTitle }: Props) {
  const content = JSON.parse(contentJson);

  return (
    <>
      <Head>
        <title>{title || mainTitle || "My Notion Blog"}</title>
        <meta name="title" content={title || mainTitle || "My Notion Blog"} />
        <link rel="icon" href="/profile.jpg" />
      </Head>
      <div className="mt-16">
        <NotionRenderer recordMap={content} fullPage disableHeader />
      </div>
    </>
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

  const pageData = getMainPage(content);
  const title = getTextContent(pageData?.properties?.title);

  return {
    props: { id, contentJson: JSON.stringify(content), title },
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
  const schema = getSchema(databaseMap, databaseId);

  const paths = postData
    .map((data) => {
      const mainPage = getMainPage(data.data);

      if (!mainPage) {
        return null;
      }

      const pageId = mainPage.id.replaceAll("-", "");
      const title = getTextContent(mainPage.properties?.title);

      const published = getColumnData(mainPage, schema, "Published");

      if (!published) {
        return null;
      }

      return {
        params: {
          id: pageId,
          title,
          mainTitle: getTextContent(mainPage.properties?.title),
        },
      };
    })
    .filter(Boolean) as { params: { id: string } }[];

  return {
    paths,
    fallback: false,
  };
};
