import matter from "gray-matter";
import {
  Block,
  BlockType,
  ExtendedRecordMap,
  ImageBlock,
  PageBlock,
} from "notion-types";
import { getPageContentBlockIds, getTextContent } from "notion-utils";

export type PageData = {
  id: string;
  data: ExtendedRecordMap;
};

export function getGrayMatter(recordMap: ExtendedRecordMap) {
  const contentIds = getPageContentBlockIds(recordMap);

  for (const contentId of contentIds) {
    const block = recordMap.block[contentId]?.value;

    if (!block) {
      continue;
    }

    if (block.type !== "code") {
      continue;
    }

    const content = getTextContent(block.properties.title);
    if (content.startsWith("---") && content.endsWith("---")) {
      const data = matter(content);
      return data.data;
    }
  }
}

export function getToggleTextContent(
  recordMap: ExtendedRecordMap,
  toggleTitle: string
) {
  const contentIds = getPageContentBlockIds(recordMap);

  for (const contentId of contentIds) {
    const block = recordMap.block[contentId]?.value;

    if (!block || !block.properties) {
      continue;
    }

    if (!("title" in block.properties)) {
      continue;
    }

    const title = getTextContent(block.properties.title).trim();

    if (title === toggleTitle) {
      const content = block.content
        ?.filter((id) => !!recordMap.block[id].value.properties)
        .map((id) => getTextContent(recordMap.block[id].value.properties.title))
        .join("\n");

      return content;
    }
  }
}

export function getMainPage(pageData: ExtendedRecordMap) {
  const contentIds = getPageContentBlockIds(pageData);

  const mainPageId = contentIds.find(
    (id) => pageData.block[id]?.value.type === "page"
  );

  if (!mainPageId) {
    return null;
  }

  return pageData.block[mainPageId].value as PageBlock;
}

export function getDirectChild(
  pageData: ExtendedRecordMap,
  type?: BlockType,
  block?: Block
) {
  let targetBlock = null;

  if (typeof block === "string") {
    if (!(block in pageData.block)) {
      return [];
    }

    targetBlock = pageData.block[block].value;
  } else if (block) {
    targetBlock = block;
  } else if (!targetBlock) {
    const contentIds = getPageContentBlockIds(pageData);

    const mainPageId = contentIds.find(
      (id) => pageData.block[id]?.value.type === "page"
    );

    if (!mainPageId) {
      return [];
    }

    targetBlock = pageData.block[mainPageId].value;
  }

  if (!targetBlock.content) {
    return [];
  }

  return targetBlock.content
    .map((id) => {
      const block = pageData.block[id]?.value;

      if (!block) {
        return null;
      }

      if (!type) {
        return block;
      }

      if (type && block.type !== type) {
        return null;
      }

      return block;
    })
    .filter(Boolean) as Block[];
}

export function getImageDownloadURL(block: ImageBlock, width?: number) {
  const source = block.format?.display_source || block.properties.source[0][0];

  if (!block.space_id || !process.env.NOTION_ACTIVE_USER) {
    return source;
  }

  const url = new URL("https://www.notion.so/image");
  url.pathname = "/image/" + encodeURIComponent(source);
  url.searchParams.set("id", block.id);
  url.searchParams.set("table", "block");
  url.searchParams.set("spaceId", block.space_id);
  url.searchParams.set("width", (width || 1200).toString());
  url.searchParams.set("userId", process.env.NOTION_ACTIVE_USER);
  url.searchParams.set("cache", "v2");

  return url.toString();
}

export function getCookieString() {
  return `notion_user_id=${process.env.NOTION_ACTIVE_USER};token_v2=${process.env.NOTION_AUTH_TOKEN}`;
}
