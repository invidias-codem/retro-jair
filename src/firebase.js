// src/firebase.js (lazy initialization)

import { initializeApp, getApps, getApp } from 'firebase/app';

let appInstance;

export function getFirebaseApp() {
  if (!appInstance) {
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'your-api-key',
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'your-auth-domain',
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'your-project-id',
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'your-storage-bucket',
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'your-messaging-sender-id',
      appId: process.env.REACT_APP_FIREBASE_APP_ID || 'your-app-id',
    };

    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Firebase app initialized lazily');
    }
  }
  return appInstance;
}

export async function getDb() {
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore(getFirebaseApp());
}

export async function getFunctionsClient(region) {
  const { getFunctions } = await import('firebase/functions');
  return getFunctions(getFirebaseApp(), region);
}
