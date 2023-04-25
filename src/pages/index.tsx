import fs from "fs/promises";
import path from "path";

import { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";

import axios from "axios";

import { NotionAPI } from "notion-client";
import {
  CollectionPropertySchemaMap,
  CollectionViewBlock,
  ExtendedRecordMap,
} from "notion-types";
import { parsePageId } from "notion-utils";
import {
  PageData,
  getDirectChild,
  getGrayMatter,
  getPostData,
  getSchema,
} from "utils/notion";

import { Article } from "components/Article";

type Metadata = {
  title: string;
  description: string;
  [key: string]: unknown;
};

type Props = {
  metadata: Metadata;
  postData: PageData[];
  schema: CollectionPropertySchemaMap;
};

const defaultMetadata = {
  title: "Blog",
  description: "My Blog, powered by Notion",
} satisfies Metadata;

async function getCoverImage(pageData: ExtendedRecordMap) {
  const templatePath = path.join(process.cwd(), "templates", "profile.jpg");
  const imagePath = path.join(process.cwd(), "public", "profile.jpg");

  const imageStat = await fs.stat(imagePath);
  if (imageStat.isFile()) {
    await fs.unlink(imagePath);
  }

  const imageList = getDirectChild(pageData, "image");
  if (imageList.length === 0) {
    await fs.copyFile(templatePath, imagePath);
    return;
  }

  const { data: imageData } = await axios.get(
    pageData.signed_urls[imageList[0].id],
    {
      responseType: "arraybuffer",
    }
  );

  await fs.writeFile(imagePath, Buffer.from(imageData));
}

async function writeMetadata(metadata: Metadata) {
  const metadataPath = path.join(process.cwd(), "metadata.json");

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

export default function MainPage({ metadata, postData, schema }: Props) {
  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="title" content={metadata.title} />
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/profile.jpg" />
      </Head>
      <div className="container mx-auto mt-24">
        <Image
          width="128"
          height="128"
          className="rounded-full mx-auto"
          src="/profile.jpg"
          alt="Profile Image"
        />
        <h1 className="mt-6 text-2xl font-bold text-center">
          {metadata.title}
        </h1>
        <p className="mt-3 w-full mx-auto px-6 whitespace-normal text-center box-border break-keep">
          {metadata.description}
        </p>
        <div className="my-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx-auto justify-items-center gap-y-6">
          {postData.map((data) => (
            <Article key={data.id} pageData={data.data} schema={schema} />
          ))}
        </div>
      </div>
    </>
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

  await getCoverImage(pageData);
  await writeMetadata(metadata);

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
      schema,
    },
    revalidate: 10 * 60, // 10 minutes
  };
};
