import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { getCookieString } from "./notion";

const PUBLIC_PATH = path.join(__dirname, "..", "..", "..", "public");

function getExtension(url: string) {
  if (url.includes("jpg")) {
    return "jpg";
  }
  if (url.includes("jpeg")) {
    return "jpeg";
  }
  if (url.includes("png")) {
    return "png";
  }
  if (url.includes("gif")) {
    return "gif";
  }
  if (url.includes("webp")) {
    return "webp";
  }
  if (url.includes("svg")) {
    return "svg";
  }
  return "";
}

export async function downloadImage(url: string | null) {
  if (!url) {
    return "";
  }

  const urlObject = new URL(url);

  const response = await fetch(url, {
    method: "GET",
    mode: "no-cors",
    headers: {
      Cookie: getCookieString(),
    },
    next: {
      revalidate: 10 * 60, // 10 minutes
    },
  });

  const pathDigest = crypto
    .createHash("sha256")
    .update(`${urlObject.protocol}${urlObject.host}${urlObject.pathname}`)
    .digest("hex");
  const paramDigest = crypto
    .createHash("sha256")
    .update(urlObject.searchParams.toString())
    .digest("hex");

  try {
    await fs.stat(path.join(PUBLIC_PATH, "images", "notion", pathDigest));
  } catch (e) {
    await fs.mkdir(path.join(PUBLIC_PATH, "images", "notion", pathDigest), {
      recursive: true,
    });
  }

  try {
    await fs.stat(
      path.join(PUBLIC_PATH, "images", "notion", pathDigest, paramDigest)
    );
  } catch (e) {
    await fs.mkdir(
      path.join(PUBLIC_PATH, "images", "notion", pathDigest, paramDigest),
      { recursive: true }
    );
  }

  const listDir = await fs.readdir(
    path.join(PUBLIC_PATH, "images", "notion", pathDigest, paramDigest)
  );

  for (const file of listDir) {
    const filePath = path.join(
      PUBLIC_PATH,
      "images",
      "notion",
      pathDigest,
      paramDigest,
      file
    );
    await fs.unlink(filePath);
  }

  const currentTime = Date.now();

  await fs.writeFile(
    path.join(
      PUBLIC_PATH,
      "images",
      "notion",
      pathDigest,
      paramDigest,
      `${currentTime}.${getExtension(url)}`
    ),
    Buffer.from(await response.arrayBuffer())
  );

  return `/images/notion/${pathDigest}/${paramDigest}/${currentTime}.${getExtension(
    url
  )}`;
}
