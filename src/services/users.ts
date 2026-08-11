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
import {
  blobToDataUrl,
  compressAvatarFile,
  isRemotePhotoUrl,
  prepareAvatarDataUrl,
  resolveImageContentType,
  shouldUseFirebaseStorage,
} from "@/lib/profile/avatar-utils";
import { getFirestoreErrorMessage, getStorageErrorMessage } from "@/lib/errors";
import { withTransientRetry } from "@/lib/firebase/retry";
import { withTimeout } from "@/lib/timeout";
import {
  normalizeDisplayName,
  validateAvatarFile,
  validateDisplayName,
} from "@/lib/profile/profile-utils";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { readProfileCache, writeProfileCache } from "@/lib/profile/profile-cache";
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

function resolveBaseProfile(user: User): UserProfile {
  return readProfileCache(user.uid) ?? buildProfileFromAuth(user);
}

function buildUpdatedProfile(
  user: User,
  base: UserProfile,
  input: UpdateUserProfileInput,
): UserProfile {
  return {
    ...base,
    uid: user.uid,
    email: user.email ?? base.email,
    displayName:
      input.displayName !== undefined
        ? normalizeDisplayName(input.displayName)
        : base.displayName,
    photoURL:
      input.photoURL === null
        ? ""
        : input.photoURL !== undefined
          ? input.photoURL
          : base.photoURL,
    updatedAt: new Date().toISOString(),
  };
}

async function persistProfileToFirestore(profile: UserProfile): Promise<UserProfile> {
  const ref = userDocRef(profile.uid);
  await setDoc(ref, profile, { merge: true });
  return profile;
}

export interface EnsureUserProfileResult {
  profile: UserProfile;
  syncedToCloud: boolean;
}

/** Create the Firestore user document if it does not exist yet. */
export async function ensureUserProfile(
  user: User,
): Promise<EnsureUserProfileResult> {
  try {
    const profile = await withTransientRetry(async () => {
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

    writeProfileCache(profile);
    return { profile, syncedToCloud: true };
  } catch {
    const fallback = resolveBaseProfile(user);
    writeProfileCache(fallback);
    return { profile: fallback, syncedToCloud: false };
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

        const profile = mapUserProfile(userId, snapshot.data());
        writeProfileCache(profile);
        onUpdate(profile);
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

/** Store a profile photo in Firestore (free plan) or optionally Firebase Storage. */
export async function uploadUserAvatar(user: User, file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new UserProfileError(validationError);
  }

  if (!shouldUseFirebaseStorage()) {
    try {
      return await prepareAvatarDataUrl(file);
    } catch (error) {
      throw new UserProfileError(
        error instanceof Error ? error.message : "Could not process the selected image.",
      );
    }
  }

  const contentType = resolveImageContentType(file);
  let compressedBlob: Blob;

  try {
    compressedBlob = await compressAvatarFile(file, contentType);
  } catch (error) {
    throw new UserProfileError(
      error instanceof Error ? error.message : "Could not process the selected image.",
    );
  }

  try {
    return await withTimeout(
      async () => {
        const extension = avatarExtension(contentType);
        const storageRef = ref(
          getFirebaseStorage(),
          `users/${user.uid}/avatar.${extension}`,
        );

        await uploadBytes(storageRef, compressedBlob, { contentType });
        return getDownloadURL(storageRef);
      },
      20_000,
      "Photo upload timed out. Check your connection or Firebase Storage setup.",
    );
  } catch (storageError) {
    try {
      return await blobToDataUrl(compressedBlob);
    } catch {
      throw new UserProfileError(getStorageErrorMessage(storageError));
    }
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

  const baseProfile = resolveBaseProfile(user);
  const nextProfile = buildUpdatedProfile(user, baseProfile, input);

  try {
    const authUpdates: { displayName?: string; photoURL?: string | null } = {};

    if (input.displayName !== undefined) {
      authUpdates.displayName = nextProfile.displayName;
    }

    if (input.photoURL !== undefined) {
      if (input.photoURL === null || isRemotePhotoUrl(input.photoURL)) {
        authUpdates.photoURL = input.photoURL;
      }
    }

    if (Object.keys(authUpdates).length > 0) {
      await withTimeout(
        () => updateProfile(user, authUpdates),
        15_000,
        "Profile update timed out. Check your connection and try again.",
      );
    }

    writeProfileCache(nextProfile);

    try {
      await withTimeout(
        () => withTransientRetry(() => persistProfileToFirestore(nextProfile)),
        20_000,
        "Could not save your profile to Firestore.",
      );
    } catch {
      // Auth + local cache are updated; cloud sync can retry later.
    }

    return nextProfile;
  } catch (error) {
    if (error instanceof UserProfileError) {
      throw error;
    }

    throw new UserProfileError(
      getFirestoreErrorMessage(error) || "Failed to update user profile.",
    );
  }
}
