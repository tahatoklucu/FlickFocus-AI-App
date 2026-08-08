import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { getFirestoreErrorMessage } from "@/lib/errors";
import { withTransientRetry } from "@/lib/retry";
import {
  normalizeDisplayName,
  validateAvatarFile,
  validateDisplayName,
} from "@/lib/profile-utils";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import type { UserProfile } from "@/types/user";

export interface UpdateUserProfileInput {
  displayName?: string;
  photoURL?: string | null;
}

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
    return await withTransientRetry(async () => {
      const ref = userDocRef(user.uid);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const existing = mapUserProfile(user.uid, snapshot.data());
        const synced: UserProfile = {
          ...existing,
          email: user.email ?? existing.email,
          displayName: existing.displayName.trim()
            ? existing.displayName
            : (user.displayName ?? existing.displayName ?? "User"),
          photoURL: existing.photoURL.trim()
            ? existing.photoURL
            : (user.photoURL ?? existing.photoURL ?? ""),
        };

        const needsUpdate =
          synced.email !== existing.email ||
          synced.displayName !== existing.displayName ||
          synced.photoURL !== existing.photoURL;

        if (needsUpdate) {
          const updated: UserProfile = {
            ...synced,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(ref, updated, { merge: true });
          return updated;
        }

        return existing;
      }

      const profile = buildProfileFromAuth(user);
      await setDoc(ref, profile);
      return profile;
    });
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

function avatarExtension(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/** Upload a profile photo and return its public download URL. */
export async function uploadUserAvatar(user: User, file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new UserProfileError(validationError);
  }

  try {
    const extension = avatarExtension(file.type);
    const storageRef = ref(
      getFirebaseStorage(),
      `users/${user.uid}/avatar.${extension}`,
    );

    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  } catch (error) {
    throw new UserProfileError(
      getFirestoreErrorMessage(error) || "Failed to upload profile photo.",
    );
  }
}

/** Update Firebase Auth and the Firestore profile document. */
export async function updateUserProfile(
  user: User,
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  if (input.displayName !== undefined) {
    const validationError = validateDisplayName(input.displayName);
    if (validationError) {
      throw new UserProfileError(validationError);
    }
  }

  try {
    const authUpdates: { displayName?: string; photoURL?: string | null } = {};

    if (input.displayName !== undefined) {
      authUpdates.displayName = normalizeDisplayName(input.displayName);
    }

    if (input.photoURL !== undefined) {
      authUpdates.photoURL = input.photoURL;
    }

    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(user, authUpdates);
    }

    const ref = userDocRef(user.uid);
    const snapshot = await getDoc(ref);
    const existing = snapshot.exists()
      ? mapUserProfile(user.uid, snapshot.data())
      : buildProfileFromAuth(user);

    const updated: UserProfile = {
      ...existing,
      email: user.email ?? existing.email,
      displayName:
        input.displayName !== undefined
          ? normalizeDisplayName(input.displayName)
          : existing.displayName,
      photoURL:
        input.photoURL === null
          ? ""
          : input.photoURL !== undefined
            ? input.photoURL
            : existing.photoURL,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, updated, { merge: true });
    return updated;
  } catch (error) {
    if (error instanceof UserProfileError) {
      throw error;
    }

    throw new UserProfileError(
      getFirestoreErrorMessage(error) || "Failed to update user profile.",
    );
  }
}
