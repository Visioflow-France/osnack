import { deleteApp, getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Firebase config is read from public env vars (NEXT_PUBLIC_* so they ship to
 * the browser, which is required for the client-side SDK). Until the project is
 * configured, `isFirebaseConfigured` is false and the app falls back to the
 * static seed menu — so the site keeps working with zero Firebase setup.
 *
 * Copy .env.local.example → .env.local and fill in the values from
 * Firebase Console → Project settings → Your apps → SDK setup and config.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

if (isFirebaseConfigured) {
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _db = getFirestore(_app);
  _auth = getAuth(_app);
}

export const app = _app;
export const db = _db;
export const auth = _auth;

/**
 * App Firebase secondaire : permet à l'ADMIN de créer un compte CLIENT
 * depuis le comptoir SANS déloguer sa propre session. On initialise un
 * second `initializeApp` (même config, nom 'AdminWorker'), on crée le
 * compte dessus, puis on supprime cette app temporaire.
 */
export async function withSecondaryAuth<T>(
  fn: (auth: Auth) => Promise<T>,
): Promise<T> {
  if (!isFirebaseConfigured) throw new Error('Firebase non configuré');
  const secondaryApp = initializeApp(firebaseConfig, 'AdminWorker');
  try {
    const secondaryAuth = getAuth(secondaryApp);
    return await fn(secondaryAuth);
  } finally {
    await deleteApp(secondaryApp);
  }
}
