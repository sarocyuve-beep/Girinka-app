// Firebase initialization — Firestore is the app's database while we're in
// the free/testing phase (Spark plan covers this comfortably at pilot scale:
// 1 GiB storage, 50k reads + 20k writes/day).
//
// SETUP (one-time):
// 1. Go to https://console.firebase.google.com -> Add project (free "Spark" plan).
// 2. Build -> Firestore Database -> Create database -> start in "test mode"
//    for now (we'll lock it down with real security rules before going live).
// 3. Project settings (gear icon) -> General -> "Your apps" -> Add app -> Web (</>) .
// 4. Copy the firebaseConfig values it gives you into the object below,
//    or better, put them in a .env file and read them with expo-constants
//    (see README.md "Environment variables").

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "REPLACE_ME",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "REPLACE_ME.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "REPLACE_ME",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "REPLACE_ME.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "REPLACE_ME",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "REPLACE_ME",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// React Native has no IndexedDB, so we use the in-memory cache. Data is
// still safely stored server-side in Firestore; this just means each cold
// app start re-fetches from the network instead of reading a local cache.
// (True offline-first support can come back later via a sync queue, same
// idea the app already had planned for expo-sqlite.)
let dbInstance: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
    });
  } catch {
    dbInstance = getFirestore(firebaseApp);
  }
  return dbInstance;
}

// Firebase Authentication (Email/Password). We use AsyncStorage persistence so
// a signed-in user stays signed in after the app is closed and reopened.
// initializeAuth may only be called once per app, so on a hot reload we fall
// back to getAuth (which returns the already-initialised instance).
let authInstance: Auth | null = null;

export function getAuthInstance(): Auth {
  if (authInstance) return authInstance;
  try {
    authInstance = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
}

// Staff sign in with a short username (e.g. "jean.mukiza"); Firebase needs an
// email, so we append this fake domain. Create users in Firebase Console ->
// Authentication -> Users -> Add user, using username@<this domain>.
export const AUTH_EMAIL_DOMAIN = "girinka.local";

// Collection name constants, kept in one place so a rename is a one-line edit.
export const COLLECTIONS = {
  selectionCampaigns: "selectionCampaigns",
  candidates: "candidates",
  eligibilityChecklists: "eligibilityChecklists",
  assessmentScores: "assessmentScores",
  committeeDecisions: "committeeDecisions",
  appeals: "appeals",
  beneficiaries: "beneficiaries",
  animals: "animals",
  distributions: "distributions",
  incidents: "incidents",
  followUps: "followUps",
  passOns: "passOns",
  passOnAssessments: "passOnAssessments",
  shedInspections: "shedInspections",
  users: "users", // profile per signed-in user: users/{uid} (role, location scope)
  meta: "meta", // small bookkeeping docs, e.g. { seeded: true }
} as const;
