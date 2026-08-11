import { FirebaseError } from "firebase/app";
import { isImageFile } from "@/lib/profile/avatar-utils";

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/*";

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateDisplayName(value: string): string | null {
  const normalized = normalizeDisplayName(value);

  if (normalized.length < DISPLAY_NAME_MIN_LENGTH) {
    return `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.`;
  }

  if (normalized.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}

export function validateAvatarFile(file: File): string | null {
  if (!isImageFile(file)) {
    return "Please choose a valid image file.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return "Profile photo must be 2 MB or smaller.";
  }

  return null;
}

export function getProfileUpdateErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/requires-recent-login":
        return "Please sign in again before updating your profile.";
      case "storage/unauthorized":
        return "You do not have permission to upload this photo.";
      case "storage/canceled":
        return "Photo upload was canceled.";
      case "storage/quota-exceeded":
        return "Storage quota exceeded. Try a smaller image.";
      case "storage/unauthenticated":
        return "Your session expired. Please sign in again.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to update profile. Please try again.";
}
