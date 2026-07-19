/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// @ts-ignore
const firebaseConfig = typeof __FIREBASE_CONFIG__ !== "undefined" ? __FIREBASE_CONFIG__ : null;

let db: any = null;
let isFirebaseEnabled = false;

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    isFirebaseEnabled = true;
    console.log("Firebase Firestore initialized successfully:", firebaseConfig.projectId);
  } else {
    console.warn("Firebase config is missing or empty. Using localStorage fallback.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase, falling back to localStorage:", error);
}

export { db, isFirebaseEnabled };
