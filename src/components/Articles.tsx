import { CollectionPropertySchemaMap, ExtendedRecordMap } from "notion-types";
import { getTextContent } from "notion-utils";
import { Suspense } from "react";
import { getMainPage } from "utils/notion";
import { CoverImage, fetchImage, getPageCover } from "./CoverImage";
import { DummyCoverImage } from "./DummyCoverImage";

type Props = {
  pageData: ExtendedRecordMap;
  schema: CollectionPropertySchemaMap;
};

const imageResourceCache = new Map<string, ReturnType<typeof fetchImage>>();

export function Article({ pageData, schema }: Props) {
  const pageBlock = getMainPage(pageData);
  if (!pageBlock) {
    return <></>;
  }

  const tagsColumnId = Object.keys(schema).find(
    (key) => schema[key].name === "Tags"
  );

  const coverData = getPageCover(pageData, pageBlock);

  if (coverData.url && !imageResourceCache.has(coverData.url)) {
    imageResourceCache.set(coverData.url, fetchImage(coverData));
  }
  const resource = coverData.url
    ? imageResourceCache.get(coverData.url)?.read() || null
    : null;

  return (
    <div className="w-[240px] rounded-lg shadow-lg cursor-pointer">
      <Suspense fallback={<DummyCoverImage />}>
        <CoverImage coverUrl={resource} />
      </Suspense>
      <div className="p-6">
        <p className="w-full font-bold whitespace-normal">
          {getTextContent(pageBlock.properties?.title)}
        </p>
      </div>
    </div>
  );
}
