import { get, put } from "@vercel/blob";

function requireBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
}

export async function privateBlobPut(
  pathname: string,
  data: Buffer | Uint8Array,
  contentType: string
) {
  requireBlobToken();
  const body = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const blob = await put(pathname.replace(/^\/+/, ""), body, {
    access: "private",
    addRandomSuffix: false,
    contentType,
  });
  return { key: blob.pathname, url: blob.url };
}

export async function privateBlobGet(urlOrPathname: string) {
  requireBlobToken();
  return get(urlOrPathname, { access: "private" });
}
