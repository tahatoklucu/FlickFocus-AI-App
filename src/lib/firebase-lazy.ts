import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { firebaseConfig, isFirebaseConfigured } from "@/lib/firebase-config";

let appPromise: Promise<FirebaseApp> | undefined;
let authPromise: Promise<Auth> | undefined;
let dbPromise: Promise<Firestore> | undefined;
let storagePromise: Promise<FirebaseStorage> | undefined;

let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;
let cachedStorage: FirebaseStorage | undefined;

function assertConfigured() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables to .env.local.",
    );
  }
}

async function ensureFirebaseApp(): Promise<FirebaseApp> {
  assertConfigured();

  appPromise ??= (async () => {
    const { getApp, getApps, initializeApp } = await import("firebase/app");
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  })();

  return appPromise;
}

export async function ensureFirebaseAuth(): Promise<Auth> {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be used in the browser.");
  }

  if (cachedAuth) {
    return cachedAuth;
  }

  authPromise ??= (async () => {
    const [{ getAuth }, app] = await Promise.all([
      import("firebase/auth"),
      ensureFirebaseApp(),
    ]);
    cachedAuth = getAuth(app);
    return cachedAuth;
  })();

  return authPromise;
}

export async function ensureFirebaseDb(): Promise<Firestore> {
  if (typeof window === "undefined") {
    throw new Error("Firestore can only be used in the browser.");
  }

  if (cachedDb) {
    return cachedDb;
  }

  dbPromise ??= (async () => {
    const [{ getFirestore, initializeFirestore }, app] = await Promise.all([
      import("firebase/firestore"),
      ensureFirebaseApp(),
    ]);

    try {
      cachedDb = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      cachedDb = getFirestore(app);
    }

    return cachedDb;
  })();

  return dbPromise;
}

export async function ensureFirebaseStorage(): Promise<FirebaseStorage> {
  if (typeof window === "undefined") {
    throw new Error("Firebase Storage can only be used in the browser.");
  }

  if (cachedStorage) {
    return cachedStorage;
  }

  storagePromise ??= (async () => {
    const [{ getStorage }, app] = await Promise.all([
      import("firebase/storage"),
      ensureFirebaseApp(),
    ]);
    cachedStorage = getStorage(app);
    return cachedStorage;
  })();

  return storagePromise;
}

/** Sync accessor — only valid after `ensureFirebaseAuth()` resolves. */
export function getFirebaseAuthSync(): Auth {
  if (!cachedAuth) {
    throw new Error("Firebase Auth is not initialized yet.");
  }

  return cachedAuth;
}

export function getFirebaseDbSync(): Firestore {
  if (!cachedDb) {
    throw new Error("Firestore is not initialized yet.");
  }

  return cachedDb;
}

export function getFirebaseStorageSync(): FirebaseStorage {
  if (!cachedStorage) {
    throw new Error("Firebase Storage is not initialized yet.");
  }

  return cachedStorage;
}
