import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:123456789:web:demo',
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const firestoreDb: Firestore = getFirestore(firebaseApp);

export const isFirebaseConfigured =
  Boolean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) &&
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID !== 'demo-project';
