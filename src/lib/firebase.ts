export { firebaseConfig, isFirebaseConfigured } from "@/lib/firebase-config";
export {
  ensureFirebaseAuth,
  ensureFirebaseDb,
  ensureFirebaseStorage,
  getFirebaseAuthSync as getFirebaseAuth,
  getFirebaseDbSync as getFirebaseDb,
  getFirebaseStorageSync as getFirebaseStorage,
} from "@/lib/firebase-lazy";
