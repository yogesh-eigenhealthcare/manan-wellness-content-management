import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyAQjohVUDHZLMnlzTYTtbg80KQMvIQyd6k",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "manan-content-management.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "manan-content-management",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "manan-content-management.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "323068075369",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:323068075369:web:daf973e9787305cdb871f8",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-YVKT6NYX0Y",
};

const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

let emulatorsConnected = false;

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_EMULATORS === "true" &&
  !emulatorsConnected
) {
  emulatorsConnected = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

let analyticsPromise: Promise<Analytics | null> | null = null;

export function initClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

export { app, auth, db };
