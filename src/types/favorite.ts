/** A movie saved to a user's favorites list (stored in Firebase). */
export interface UserFavorite {
  id: string;
  userId: string;
  imdbID: string;
  title: string;
  year: string;
  poster: string;
  addedAt: string;
}

/** Payload used when adding a new favorite (server generates id and addedAt). */
export interface AddFavoritePayload {
  imdbID: string;
  title: string;
  year: string;
  poster: string;
}
