import * as admin from 'firebase-admin';

// Ensure environment variables are set
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Private key needs special handling for newline characters if stored directly in .env
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Firebase Admin SDK environment variables not set. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are configured.');
  // Optionally throw an error or handle this case as needed for your application startup
  // throw new Error('Firebase Admin SDK environment variables not set.');
}

// Check if the app is already initialized to prevent duplicates
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      // Optionally add databaseURL if needed, though often inferred
      // databaseURL: `https://${projectId}.firebaseio.com`
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    // Handle initialization error appropriately
  }
} else {
  // console.log('Firebase Admin SDK already initialized.');
}

// Export the initialized admin services
const adminAuth = admin.auth();
const adminDb = admin.firestore();
// Export other admin services like storage if needed
// const adminStorage = admin.storage();

export { admin, adminAuth, adminDb /*, adminStorage */ };
