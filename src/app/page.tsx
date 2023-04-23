import Image from "next/image";
import { redirect } from "next/navigation";
import { GenerateMetadata } from "types/next";

import { Article } from "components/Articles";
import { NotionAPI } from "notion-client";
import {
  CollectionPropertySchemaMap,
  CollectionViewBlock,
  ExtendedRecordMap,
  ImageBlock,
} from "notion-types";
import { parsePageId } from "notion-utils";
import { downloadImage } from "utils/image";
import {
  getDirectChild,
  getGrayMatter,
  getImageDownloadURL,
} from "utils/notion";

type PageData = {
  id: string;
  data: ExtendedRecordMap;
};

const notion = new NotionAPI({
  activeUser: process.env.NOTION_ACTIVE_USER,
  authToken: process.env.NOTION_AUTH_TOKEN,
});

const pageId = parsePageId(process.env.NOTION_PAGE_URL);

export const generateMetadata: GenerateMetadata = async () => {
  const pageId = parsePageId(process.env.NOTION_PAGE_URL);
  const recordMap = await notion.getPage(pageId);
  const metadata = getGrayMatter(recordMap);

  if (!metadata) {
    return {
      title: "Blog",
    };
  }

  return {
    title: metadata.title,
  };
};

export default async function Page() {
  const recordMap = await notion.getPage(pageId);
  const metadata = getGrayMatter(recordMap);

  if (!metadata) {
    redirect("/500");
  }

  const imageList = getDirectChild(recordMap, "image") as ImageBlock[];
  const profileImage: string =
    imageList.length !== 0
      ? await downloadImage(getImageDownloadURL(imageList[0], 128))
      : "/profile.jpg";

  const databaseView = getDirectChild(
    recordMap,
    "collection_view"
  ) as CollectionViewBlock[];

  if (
    databaseView.length === 0 ||
    databaseView[0].collection_id === undefined
  ) {
    redirect("/500");
  }
  const databaseId = databaseView[0].collection_id;
  const databaseMap = await notion.getCollectionData(
    databaseId,
    databaseView[0].view_ids[0],
    databaseView[0],
    { loadContentCover: true }
  );

  const schema: CollectionPropertySchemaMap =
    // @ts-expect-error: Somethings wrong here
    databaseMap.recordMap.collection[databaseId].value.schema;

  if (!databaseMap) {
    redirect("/500");
  }

  const postIds: string[] =
    // @ts-expect-error: Somethings wrong here
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
