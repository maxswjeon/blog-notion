import fs from "fs/promises";
import path from "path";

import nextEnv from "@next/env";

import axios from "axios";
import matter from "gray-matter";

import { NotionAPI } from "notion-client";
import {
  getPageContentBlockIds,
  getTextContent,
  parsePageId,
} from "notion-utils";

const { loadEnvConfig } = nextEnv;

const REQUIRED_ENVS = ["NOTION_PAGE_URL"];

const defaultMetadata = {
  title: "Blog",
  description: "My Blog, powered by Notion",
};

export function getGrayMatter(recordMap) {
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

export function getDirectChild(pageData, type, block) {
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
    .filter(Boolean);
}

async function getCoverImage(pageData) {
  const templatePath = path.join(process.cwd(), "templates", "profile.jpg");
  const imagePath = path.join(process.cwd(), "public", "profile.jpg");

  try {
    const publicStat = await fs.stat(path.join(process.cwd(), "public"));
  } catch {
    await fs.mkdir(path.join(process.cwd(), "public"));
  }

  try {
    const imageStat = await fs.stat(imagePath);
    if (imageStat.isFile()) {
      await fs.unlink(imagePath);
    }
  } catch {
    // ignore
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

async function writeMetadata(metadata) {
  const metadataPath = path.join(process.cwd(), "metadata.json");

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

async function main() {
  loadEnvConfig(process.cwd());

  for (const key of REQUIRED_ENVS) {
    if (!process.env[key]) {
      throw new Error(`Missing env ${key}`);
    }
  }

  const pageId = parsePageId(process.env.NOTION_PAGE_URL);

  const notion = new NotionAPI({
    activeUser: process.env.NOTION_ACTIVE_USER,
    authToken: process.env.NOTION_AUTH_TOKEN,
  });

  const pageData = await notion.getPage(pageId);
  const metadata = { ...defaultMetadata, ...getGrayMatter(pageData) };

  await getCoverImage(pageData);
  await writeMetadata(metadata);
}

main().catch(console.log);
