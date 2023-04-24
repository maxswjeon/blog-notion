import { Article } from "components/Article";
import { GetStaticProps } from "next";
import Image from "next/image";
import { NotionAPI } from "notion-client";
import {
  CollectionPropertySchemaMap,
  CollectionViewBlock,
  ExtendedRecordMap,
  ImageBlock,
} from "notion-types";
import { parsePageId } from "notion-utils";
import { PageData, getDirectChild, getGrayMatter } from "utils/notion";

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

  const recordMap = await notion.getPage(pageId);
  const metadata = { ...defaultMetadata, ...getGrayMatter(recordMap) };

  const imageList = getDirectChild(recordMap, "image") as ImageBlock[];
  const profileImage: string =
    imageList.length !== 0
      ? recordMap.signed_urls[imageList[0].id]
      : "/profile.jpg";

  const databaseView = getDirectChild(
    recordMap,
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

  const schema: CollectionPropertySchemaMap =
    // @ts-expect-error: Something's wrong here
    databaseMap.recordMap.collection[databaseId].value.schema;

  const postIds: string[] =
    // @ts-expect-error: Something's wrong here
    databaseMap.result.reducerResults.collection_group_results.blockIds;

  const postDataPromise = await Promise.allSettled(
    postIds.map(async (id) => ({ id, data: await notion.getPage(id) }))
  );
  const postDataFiltered = postDataPromise.filter(
    (p) => p.status !== "rejected"
  ) as PromiseFulfilledResult<PageData>[];
  const postData = postDataFiltered.map(
    (p: PromiseFulfilledResult<PageData>) => p.value
  );

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
