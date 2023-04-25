import {
  CollectionPropertySchemaMap,
  ExtendedRecordMap,
  ImageBlock,
  PageBlock,
} from "notion-types";
import { getTextContent } from "notion-utils";
import { getColumnData, getDirectChild, getMainPage } from "utils/notion";
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

    return pageData.signed_urls[pageBlock.id];
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
  if (!pageBlock || !pageBlock.properties) {
    return null;
  }

  const tags = getColumnData(pageBlock, schema, "Tags");
  const published = getColumnData(pageBlock, schema, "Published");

  if (!published) {
    return null;
  }

  const title = getTextContent(pageBlock.properties.title);
  const pageId = pageBlock.id.replaceAll("-", "");
  const path = `/${pageId}`;

  return (
    <a
      href={path}
      className="block w-[240px] rounded-lg shadow-lg cursor-pointer"
    >
      <CoverImage coverUrl={getPageCover(pageData, pageBlock)} />
      <div className="p-6">
        <p className="w-full font-bold whitespace-normal">{title}</p>
      </div>
    </a>
  );
}
