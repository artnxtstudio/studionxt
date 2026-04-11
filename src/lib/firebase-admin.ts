import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function initAdminIfNeeded(): void {
  if (getApps().length > 0) return;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  adminApp = initializeApp({ credential: cert(serviceAccount) });
}

export function getAdminDb() {
  initAdminIfNeeded();
  return getFirestore();
}
