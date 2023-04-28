import {
  CollectionPropertySchemaMap,
  ExtendedRecordMap,
  ImageBlock,
  PageBlock,
} from "notion-types";
import { getTextContent } from "notion-utils";
import {
  getColumnData,
  getDirectChild,
  getMainPage,
  getSelectColors,
} from "utils/notion";
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

  const tags = getColumnData(pageBlock, schema, "Tags") || [[""]];
  const published = getColumnData(pageBlock, schema, "Published");
  const tagColors = getSelectColors(schema, "Tags");

  if (!published || !tagColors || published[0][0] !== "Yes") {
    return null;
  }

  const title = getTextContent(pageBlock.properties.title);
  const pageId = pageBlock.id.replaceAll("-", "");
  const path = `/posts/${pageId}`;

  const Tags = tags[0][0]
    .split(",")
    .map((tag) => {
      const color = tagColors.find((c) => c.value === tag)?.color;

      if (!color) {
        return null;
      }

      return (
        <span
          key={tag}
          className={`rounded-full px-3 py-1 notion-bg-${color} text-gray-900 text-xs`}
        >
          {tag}
        </span>
      );
    })
    .filter(Boolean);

  return (
    <a
      href={path}
      className="block w-[240px] rounded-lg shadow-lg cursor-pointer"
    >
      <CoverImage coverUrl={getPageCover(pageData, pageBlock)} />
      <div className="p-6">
        <div className="flex gap-2 overflow-hidden">{Tags}</div>
        <p className="w-full mt-3 font-bold whitespace-normal">{title}</p>
      </div>
    </a>
  );
}
