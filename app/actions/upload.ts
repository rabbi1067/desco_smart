"use server";

import { getAuthedUserId } from "@/lib/auth";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  CLOUDINARY_AVATAR_FOLDER,
  MAX_AVATAR_BYTES,
} from "@/lib/constants";
import type { ActionResult } from "@/types";

/**
 * Avatar image upload to Cloudinary.
 *
 * The browser sends the raw file to this Server Action; the file never touches
 * the client's Cloudinary credentials because there are none on the client —
 * the signed upload happens entirely here. The action returns only the final
 * HTTPS URL, which the profile form stores in `profiles.avatar_url`.
 *
 * Validation is enforced server-side (type + size) regardless of any client
 * check, and the call is rate-limited because it drives a billable third-party
 * API.
 */
export async function uploadAvatarAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const userId = await getAuthedUserId();
  if (!userId) return { success: false, error: "error.sessionExpired" };

  if (!isCloudinaryConfigured()) {
    return { success: false, error: "error.uploadNotConfigured" };
  }

  // 10 uploads/min/user: ample for real use, throttles abuse.
  const limit = rateLimit(`upload:${userId}`, 10, 60_000);
  if (!limit.ok) return { success: false, error: "error.rateLimited" };

  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return { success: false, error: "error.uploadFailed" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false, error: "profile.uploadSizeError" };
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "profile.uploadTypeError" };
  }

  const result = await uploadImage(file, {
    folder: CLOUDINARY_AVATAR_FOLDER,
    // One stable asset per user — overwritten on each change, no orphans.
    publicId: `user_${userId}`,
  });
  if (!result.ok) return { success: false, error: result.error };

  return {
    success: true,
    data: { url: result.data.url },
    message: "profile.uploadSuccess",
  };
}
