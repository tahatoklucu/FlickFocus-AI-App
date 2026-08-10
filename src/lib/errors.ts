import { FirebaseError } from "firebase/app";

export function getFirestoreErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "permission-denied":
        return "Firestore access denied. Check user rules in Firebase Console → Firestore Rules.";
      case "unavailable":
        return "Could not reach Firestore. Enable Firestore in Firebase Console or check your internet connection.";
      case "failed-precondition":
        return "Firestore is not set up for this project. Create a Firestore database in Firebase Console.";
      case "unauthenticated":
        return "Your session expired. Please sign in again.";
      case "resource-exhausted":
        return "Too many requests. Please wait a moment and try again.";
      default:
        return error.message || "Failed to access favorites.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to access favorites.";
}

export function getStorageErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "storage/unauthorized":
        return "You do not have permission to upload this photo.";
      case "storage/canceled":
        return "Photo upload was canceled.";
      case "storage/quota-exceeded":
        return "Storage quota exceeded. Try a smaller image.";
      case "storage/unauthenticated":
        return "Your session expired. Please sign in again.";
      case "storage/object-not-found":
        return "Uploaded photo could not be found. Please try again.";
      case "storage/retry-limit-exceeded":
        return "Photo upload failed after several attempts. Check your connection.";
      case "storage/unknown":
        return "Photo upload failed. Make sure Firebase Storage is enabled.";
      default:
        return error.message || "Failed to upload profile photo.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to upload profile photo.";
}

export function getUnknownErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
