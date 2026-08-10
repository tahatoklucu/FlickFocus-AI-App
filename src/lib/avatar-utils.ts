const AVATAR_DIMENSION = 256;
const MAX_AVATAR_DATA_URL_LENGTH = 450_000;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function resolveImageContentType(file: File): string {
  if (file.type.startsWith("image/")) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? IMAGE_EXTENSIONS.has(extension) : false;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image."));
    };

    image.src = objectUrl;
  });
}

export async function compressAvatarFile(
  file: File,
  contentType: string,
): Promise<Blob> {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not process the selected image.");
  }

  const size = AVATAR_DIMENSION;
  canvas.width = size;
  canvas.height = size;

  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

  const outputType =
    contentType === "image/png" || contentType === "image/gif"
      ? contentType
      : "image/jpeg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not compress the selected image."));
          return;
        }

        resolve(result);
      },
      outputType,
      outputType === "image/jpeg" ? 0.82 : undefined,
    );
  });

  return blob;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not prepare the selected image."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Could not prepare the selected image."));
    };

    reader.readAsDataURL(blob);
  });
}

export function isValidPhotoURL(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  const url = value.trim();

  if (url === "null" || url === "undefined") {
    return false;
  }

  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("data:image/") ||
    url.startsWith("blob:")
  );
}

export function resolveUserPhotoURL(
  userProfile: { photoURL?: string } | null,
  user: { photoURL?: string | null } | null,
): string | null {
  if (userProfile) {
    const fromProfile = userProfile.photoURL?.trim();
    if (fromProfile && isValidPhotoURL(fromProfile)) {
      return fromProfile;
    }

    return null;
  }

  const fromAuth = user?.photoURL?.trim();
  if (fromAuth && isValidPhotoURL(fromAuth)) {
    return fromAuth;
  }

  return null;
}

export function isRemotePhotoUrl(photoURL: string | null | undefined): boolean {
  return Boolean(photoURL && /^https?:\/\//.test(photoURL));
}

/** Compress an image and return a Firestore-safe data URL (no Storage required). */
export async function prepareAvatarDataUrl(file: File): Promise<string> {
  const contentType = resolveImageContentType(file);
  let blob = await compressAvatarFile(file, contentType);
  let dataUrl = await blobToDataUrl(blob);

  if (dataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH) {
    return dataUrl;
  }

  blob = await compressAvatarFile(file, "image/jpeg");
  dataUrl = await blobToDataUrl(blob);

  if (dataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH) {
    return dataUrl;
  }

  throw new Error(
    "This photo is too large after compression. Try a smaller image.",
  );
}

export function shouldUseFirebaseStorage(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_USE_STORAGE === "true";
}
