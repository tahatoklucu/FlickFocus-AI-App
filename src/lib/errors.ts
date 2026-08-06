import { FirebaseError } from "firebase/app";

export function getFirestoreErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "permission-denied":
        return "You do not have permission to access favorites. Check your Firestore security rules.";
      case "unavailable":
        return "Firestore is temporarily unavailable. Please check your connection and try again.";
      case "failed-precondition":
        return "Favorites could not be loaded. Please refresh and try again.";
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

export function getUnknownErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
