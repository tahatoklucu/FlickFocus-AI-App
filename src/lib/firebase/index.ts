export { firebaseConfig, isFirebaseConfigured } from "./firebase-config";
export {
  ensureFirebaseAuth,
  ensureFirebaseDb,
  ensureFirebaseStorage,
  getFirebaseAuthSync as getFirebaseAuth,
  getFirebaseDbSync as getFirebaseDb,
  getFirebaseStorageSync as getFirebaseStorage,
} from "./firebase-lazy";
