import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseDb: Firestore | undefined;
let firebaseStorage: FirebaseStorage | undefined;

export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every(Boolean);
}

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables to .env.local.",
    );
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be used in the browser.");
  }

  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }

  return firebaseAuth;
}

function createFirestore(): Firestore {
  const app = getFirebaseApp();

  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}

export function getFirebaseDb(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("Firestore can only be used in the browser.");
  }

  if (!firebaseDb) {
    firebaseDb = createFirestore();
  }

  return firebaseDb;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (typeof window === "undefined") {
    throw new Error("Firebase Storage can only be used in the browser.");
  }

  if (!firebaseStorage) {
    firebaseStorage = getStorage(getFirebaseApp());
  }

  return firebaseStorage;
}
