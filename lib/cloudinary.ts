import "server-only";

import { createHash } from "node:crypto";
import { CLOUDINARY_UPLOAD_FOLDER } from "@/lib/constants";

/**
 * Minimal Cloudinary signed-upload adapter.
 *
 * WHY NO SDK
 * ----------
 * Cloudinary's signed upload is a single multipart POST plus a SHA-1 signature.
 * Doing it with the Node standard library (`crypto`) + the global `fetch`/
 * `FormData` keeps the dependency surface exactly as the rest of this project
 * chose it: no package added just to concatenate strings and hash them.
 *
 * SECURITY
 * --------
 * The API secret lives ONLY in the environment and ONLY on the server (this
 * module is `server-only`, so importing it from a Client Component is a build
 * error). The secret is used to compute the signature and is never placed in
 * any field sent to the browser, and never logged. On failure we return a
 * translation key — never Cloudinary's raw error, which could echo request
 * details.
 */

export interface CloudinaryUploadResult {
  /** HTTPS, version-stamped delivery URL — safe to store and render. */
  url: string;
  /** Stable id (for later overwrite/deletion). */
  publicId: string;
  bytes: number;
  format: string;
  width: number | null;
  height: number | null;
}

export type CloudinaryResult =
  | { ok: true; data: CloudinaryUploadResult }
  | { ok: false; error: string };

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

function readConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/** True when all three Cloudinary env vars are present. */
export function isCloudinaryConfigured(): boolean {
  return readConfig() !== null;
}

/**
 * Cloudinary signature: SHA-1 of the signed params as a sorted `k=v&k=v`
 * string with the API secret appended. `file`, `api_key`, `resource_type` and
 * `cloud_name` are deliberately NOT part of the signature, per Cloudinary's
 * spec.
 */
function sign(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

/**
 * Uploads one image to Cloudinary. When `publicId` is given the asset is
 * overwritten in place (so a user keeps a single avatar asset rather than
 * accumulating orphans); the returned URL is version-stamped, so the new image
 * is served immediately despite CDN caching.
 */
export async function uploadImage(
  file: Blob,
  options: { folder?: string; publicId?: string } = {},
): Promise<CloudinaryResult> {
  const config = readConfig();
  if (!config) return { ok: false, error: "error.uploadNotConfigured" };

  const folder = options.folder ?? CLOUDINARY_UPLOAD_FOLDER;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signedParams: Record<string, string> = { folder, timestamp };
  if (options.publicId) {
    signedParams.public_id = options.publicId;
    signedParams.overwrite = "true";
  }
  const signature = sign(signedParams, config.apiSecret);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", config.apiKey);
  for (const [k, v] of Object.entries(signedParams)) form.append(k, v);
  form.append("signature", signature);

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      { method: "POST", body: form, signal: AbortSignal.timeout(30_000) },
    );
  } catch {
    // Network error or timeout — nothing sensitive to surface.
    return { ok: false, error: "error.uploadFailed" };
  }

  if (!response.ok) return { ok: false, error: "error.uploadFailed" };

  let payload: Record<string, unknown>;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "error.uploadFailed" };
  }

  const url = typeof payload.secure_url === "string" ? payload.secure_url : null;
  const publicId =
    typeof payload.public_id === "string" ? payload.public_id : null;
  if (!url || !publicId) return { ok: false, error: "error.uploadFailed" };

  return {
    ok: true,
    data: {
      url,
      publicId,
      bytes: typeof payload.bytes === "number" ? payload.bytes : 0,
      format: typeof payload.format === "string" ? payload.format : "",
      width: typeof payload.width === "number" ? payload.width : null,
      height: typeof payload.height === "number" ? payload.height : null,
    },
  };
}
