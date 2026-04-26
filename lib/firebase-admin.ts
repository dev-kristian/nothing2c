import * as admin from 'firebase-admin';

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PRIVATE_FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL ||
  process.env.NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL;
const privateKey = (
  process.env.FIREBASE_PRIVATE_KEY ||
  process.env.NEXT_PRIVATE_FIREBASE_PRIVATE_KEY
)?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  try {
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      console.warn('Firebase Admin SDK env vars are not set. Falling back to default app initialization.');
      admin.initializeApp(
        projectId
          ? {
              projectId,
            }
          : undefined
      );
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
} else {
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { admin, adminAuth, adminDb };
