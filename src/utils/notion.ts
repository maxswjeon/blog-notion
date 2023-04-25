import matter from "gray-matter";
import { NotionAPI } from "notion-client";
import {
  Block,
  BlockType,
  CollectionInstance,
  CollectionPropertySchemaMap,
  ExtendedRecordMap,
  ImageBlock,
  PageBlock,
} from "notion-types";
import { getPageContentBlockIds, getTextContent } from "notion-utils";
import * as fs from "fs/promises";
import path from "path";
import axios from "axios";

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

export async function getPostData(
  client: NotionAPI,
  databaseMap: CollectionInstance
) {
  const postIds: string[] =
    // @ts-expect-error: Something's wrong here
    databaseMap.result.reducerResults.collection_group_results.blockIds;

  const postDataPromise = await Promise.allSettled(
    postIds.map(async (id) => ({ id, data: await client.getPage(id) }))
  );
  const postDataFiltered = postDataPromise.filter(
    (p) => p.status !== "rejected"
  ) as PromiseFulfilledResult<PageData>[];

  return postDataFiltered.map((p: PromiseFulfilledResult<PageData>) => p.value);
}

export function getSchema(databaseMap: CollectionInstance, databaseId: string) {
  // @ts-expect-error: Something's wrong here
  return databaseMap.recordMap.collection[databaseId].value.schema;
}

export function getColumnData(
  pageBlock: PageBlock,
  schema: CollectionPropertySchemaMap,
  columnName: string
) {
  const columnId = Object.keys(schema).find(
    (key) => schema[key].name === columnName
  );

  if (
    !columnId ||
    !pageBlock.properties ||
    !(columnId in pageBlock.properties)
  ) {
    return null;
  }

  //@ts-expect-error: PageBlock.properties is not well typed
  return pageBlock.properties[columnId];
}
