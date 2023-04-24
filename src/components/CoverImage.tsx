import Image from "next/image";
import { ExtendedRecordMap, ImageBlock, PageBlock } from "notion-types";
import { getDirectChild } from "utils/notion";
import { DummyCoverImage } from "./DummyCoverImage";

type Props = {
  coverUrl: string | null;
};

export function CoverImage({ coverUrl }: Props) {
  if (!coverUrl) {
    return <DummyCoverImage />;
  }

  return (
    <Image
      width="240"
      height="135"
      alt="cover"
      src={coverUrl}
      className="w-[240px] h-[135px] rounded-t-lg object-cover"
    />
  );
}
