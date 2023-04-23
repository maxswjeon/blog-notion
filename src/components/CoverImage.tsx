import Image from "next/image";
import { ExtendedRecordMap, ImageBlock, PageBlock } from "notion-types";
import { downloadImage } from "utils/image";
import { getDirectChild, getImageDownloadURL } from "utils/notion";
import { DummyCoverImage } from "./DummyCoverImage";

type Props = {
  coverUrl: string | null;
};

type PageCoverData =
  | {
      shouldDownload: boolean;
      url: string;
    }
  | {
      shouldDownload: false;
      url: null;
    };

export function fetchImage(data: PageCoverData) {
  let resultUrl: string | null = null;
  let pending = data.shouldDownload;

  const suspender = downloadImage(data.url).then((l) => {
    resultUrl = l;
    pending = false;
  });

  return {
    read() {
      if (pending) {
        throw suspender;
      }

      return resultUrl;
    },
  };
}

export function getPageCover(
  pageData: ExtendedRecordMap,
  pageBlock: PageBlock
): PageCoverData {
  const cover = pageBlock.format?.page_cover;
  if (cover) {
    if (!cover.startsWith("http")) {
      return {
        shouldDownload: false,
        url: `https://www.notion.so${cover}`,
      };
    }

    return {
      shouldDownload: false,
      url: cover,
    };
  }

  const images = getDirectChild(pageData, "image") as ImageBlock[];
  if (images.length === 0) {
    return {
      shouldDownload: false,
      url: null,
    };
  }
  const image = images[0];

  return {
    shouldDownload: true,
    url: getImageDownloadURL(image, 240),
  };
}

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
