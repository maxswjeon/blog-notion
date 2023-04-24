import { useRouter } from "next/router";
import {
  CollectionPropertySchemaMap,
  ExtendedRecordMap,
  ImageBlock,
  PageBlock,
} from "notion-types";
import { getTextContent } from "notion-utils";
import { getDirectChild, getMainPage } from "utils/notion";
import { CoverImage } from "./CoverImage";

type Props = {
  pageData: ExtendedRecordMap;
  schema: CollectionPropertySchemaMap;
};

function getPageCover(
  pageData: ExtendedRecordMap,
  pageBlock: PageBlock
): string | null {
  const cover = pageBlock.format?.page_cover;
  if (cover) {
    if (!cover.startsWith("http")) {
      return `https://www.notion.so${cover}`;
    }

    return cover;
  }

  const images = getDirectChild(pageData, "image") as ImageBlock[];
  if (images.length === 0) {
    return null;
  }
  const image = images[0];

  return pageData.signed_urls[image.id];
}

export function Article({ pageData, schema }: Props) {
  const router = useRouter();

  const pageBlock = getMainPage(pageData);
  if (!pageBlock) {
    return <></>;
  }

  const tagsColumnId = Object.keys(schema).find(
    (key) => schema[key].name === "Tags"
  );

  const title = getTextContent(pageBlock.properties?.title);
  const pageId = pageBlock.id.replaceAll("-", "");

  return (
    <div
      className="w-[240px] rounded-lg shadow-lg cursor-pointer"
      onClick={() => router.push(`/${pageId}`)}
      onKeyDown={() => router.push(`/${pageId}`)}
    >
      <CoverImage coverUrl={getPageCover(pageData, pageBlock)} />
      <div className="p-6">
        <p className="w-full font-bold whitespace-normal">{title}</p>
      </div>
    </div>
  );
}
