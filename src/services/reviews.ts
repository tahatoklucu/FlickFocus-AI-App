import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreErrorMessage } from "@/lib/errors";
import { getFirebaseDb } from "@/lib/firebase";
import { parsePublicReview, sortPublicReviews } from "@/lib/public-review";
import type { PublicReview } from "@/types";

export class ReviewsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewsError";
  }
}

function reviewsCollection(imdbID: string) {
  return collection(getFirebaseDb(), "movieReviews", imdbID, "reviews");
}

function reviewDoc(imdbID: string, userId: string) {
  return doc(getFirebaseDb(), "movieReviews", imdbID, "reviews", userId);
}

/** Subscribe to every shared review for one movie. */
export function subscribeToPublicReviews(
  imdbID: string,
  onUpdate: (reviews: PublicReview[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  try {
    return onSnapshot(
      reviewsCollection(imdbID),
      (snapshot) => {
        onUpdate(
          sortPublicReviews(
            snapshot.docs.map((document) =>
              parsePublicReview(imdbID, document.id, document.data()),
            ),
          ),
        );
      },
      (error) => {
        onError?.(new ReviewsError(getFirestoreErrorMessage(error)));
      },
    );
  } catch (error) {
    onError?.(
      new ReviewsError(
        getFirestoreErrorMessage(error) || "Failed to load reviews.",
      ),
    );
    return () => {};
  }
}

/** Publish or refresh the shared copy of a review. */
export async function publishReview(review: PublicReview): Promise<void> {
  try {
    await setDoc(reviewDoc(review.imdbID, review.userId), {
      userId: review.userId,
      imdbID: review.imdbID,
      displayName: review.displayName,
      photoURL: review.photoURL,
      rating: review.rating,
      note: review.note,
      publishedAt: review.publishedAt,
    });
  } catch (error) {
    throw new ReviewsError(
      getFirestoreErrorMessage(error) || "Failed to publish your review.",
    );
  }
}

/** Remove the shared copy, leaving the private note untouched. */
export async function unpublishReview(
  imdbID: string,
  userId: string,
): Promise<void> {
  try {
    await deleteDoc(reviewDoc(imdbID, userId));
  } catch (error) {
    throw new ReviewsError(
      getFirestoreErrorMessage(error) || "Failed to hide your review.",
    );
  }
}
