import {
  initializeApp,
  getApp,
  getApps,
  FirebaseApp,
  FirebaseOptions,
} from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';

// Define Firebase config shape
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app (singleton pattern)
const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize core Firebase services
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// Initialize Analytics only on the client
let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

/**
 * Log a custom event to Firebase Analytics.
 * @param eventName - The name of the custom event.
 * @param eventParams - An optional object containing additional event parameters.
 */
export const logCustomEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>,
): void => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  } else {
    console.warn(
      'Analytics is not initialized (possibly due to a non-browser environment).',
    );
  }
};

export { app, firestore, auth, storage, functions, analytics };
