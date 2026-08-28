import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import 'dotenv/config';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!getApps().length) {
  let credentials: { projectId: string; clientEmail: string; privateKey: string } | undefined;
  const credentialsJson = process.env.FIREBASE_CREDENTIALS ?? process.env.FIREBASE_CONFIG;
  if (credentialsJson) {
    try { credentials = JSON.parse(credentialsJson) as typeof credentials; }
    catch { throw new Error('FIREBASE_CREDENTIALS must be valid JSON.'); }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    credentials = { projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey };
  }
  if (!credentials?.projectId || !credentials.clientEmail || !credentials.privateKey) {
    throw new Error('Firebase configuration is missing. Set FIREBASE_CREDENTIALS or the FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY values.');
  }

  initializeApp({
    credential: cert(credentials),
  });
}

export const db = getFirestore();
export const messaging = getMessaging();
