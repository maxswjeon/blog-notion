import { Article } from "components/Article";
import { GetStaticProps } from "next";
import Image from "next/image";
import { NotionAPI } from "notion-client";
import { CollectionPropertySchemaMap, CollectionViewBlock } from "notion-types";
import { parsePageId } from "notion-utils";
import {
  PageData,
  getCoverImage,
  getDirectChild,
  getGrayMatter,
  getPostData,
  getSchema,
} from "utils/notion";

type Props = {
  metadata: {
    title: string;
    description: string;
    [key: string]: unknown;
  };
  postData: PageData[];
  profileImage: string;
  schema: CollectionPropertySchemaMap;
};

const defaultMetadata = {
  title: "Blog",
  description: "My Blog, powered by Notion",
} satisfies Props["metadata"];

export default function MainPage({
  metadata,
  postData,
  profileImage,
  schema,
}: Props) {
  return (
    <div className="container mx-auto mt-24">
      <Image
        width="128"
        height="128"
        className="rounded-full mx-auto"
        src={profileImage}
        alt="Profile Image of Sangwan Jeon"
      />
      <h1 className="mt-6 text-2xl font-bold text-center">{metadata.title}</h1>
      <p className="mt-3 w-full mx-auto px-6 whitespace-normal text-center box-border break-keep">
        {metadata.description}
      </p>
      <div className="my-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx-auto justify-items-center gap-y-6">
        {postData.map((data) => (
          <Article key={data.id} pageData={data.data} schema={schema} />
        ))}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const pageId = parsePageId(process.env.NOTION_PAGE_URL);

  const notion = new NotionAPI({
    activeUser: process.env.NOTION_ACTIVE_USER,
    authToken: process.env.NOTION_AUTH_TOKEN,
  });

  const pageData = await notion.getPage(pageId);
  const metadata = { ...defaultMetadata, ...getGrayMatter(pageData) };

  const profileImage = getCoverImage(pageData);

  const databaseView = getDirectChild(
    pageData,
    "collection_view"
  ) as CollectionViewBlock[];

  if (
    databaseView.length === 0 ||
    databaseView[0].collection_id === undefined
  ) {
    return {
      props: {
        metadata,
        postData: [],
        profileImage,
        schema: {},
      },
      redirect: "/error",
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

  return {
    props: {
      metadata,
      postData,
      profileImage,
      schema,
    },
    revalidate: 10 * 60, // 10 minutes
  };
};
