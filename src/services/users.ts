import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirestoreErrorMessage } from "@/lib/errors";
import { getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/types/user";

export class UserProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserProfileError";
  }
}

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid);
}

export function buildProfileFromAuth(user: User): UserProfile {
  const now = new Date().toISOString();

  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "User",
    photoURL: user.photoURL ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

function mapUserProfile(
  uid: string,
  data: Record<string, unknown>,
): UserProfile {
  return {
    uid,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? "User"),
    photoURL: String(data.photoURL ?? ""),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

/** Create the Firestore user document if it does not exist yet. */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  try {
    const ref = userDocRef(user.uid);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const existing = mapUserProfile(user.uid, snapshot.data());
      const synced: UserProfile = {
        ...existing,
        email: user.email ?? existing.email,
        displayName:
          user.displayName ?? existing.displayName,
        photoURL: user.photoURL ?? existing.photoURL,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(ref, synced, { merge: true });
      return synced;
    }

    const profile = buildProfileFromAuth(user);
    await setDoc(ref, profile);
    return profile;
  } catch (error) {
    throw new UserProfileError(
      getFirestoreErrorMessage(error) || "Failed to sync user profile.",
    );
  }
}

/** Subscribe to real-time updates for a user's profile document. */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  try {
    return onSnapshot(
      userDocRef(userId),
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate(null);
          return;
        }

        onUpdate(mapUserProfile(userId, snapshot.data()));
      },
      (error) => {
        onError?.(
          new UserProfileError(getFirestoreErrorMessage(error)),
        );
      },
    );
  } catch (error) {
    onError?.(
      new UserProfileError(
        getFirestoreErrorMessage(error) || "Failed to load user profile.",
      ),
    );
    return () => {};
  }
}
