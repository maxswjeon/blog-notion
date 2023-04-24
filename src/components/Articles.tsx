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
  const pageBlock = getMainPage(pageData);
  if (!pageBlock) {
    return <></>;
  }

  const tagsColumnId = Object.keys(schema).find(
    (key) => schema[key].name === "Tags"
  );

  return (
    <div className="w-[240px] rounded-lg shadow-lg cursor-pointer">
      <CoverImage coverUrl={getPageCover(pageData, pageBlock)} />
      <div className="p-6">
        <p className="w-full font-bold whitespace-normal">
          {getTextContent(pageBlock.properties?.title)}
        </p>
      </div>
    </div>
  );
}
