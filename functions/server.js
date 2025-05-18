const isNodeEnvironment = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

if (isNodeEnvironment) {
  try {
    // Load environment variables from .env file
    // This line is the one that typically causes 'os' module issues if
    // Webpack tries to bundle it for the client without polyfills.
    // Ensure this code only runs on the server where 'os' is available.
    require('dotenv').config();
  } catch (error) {
    console.warn("dotenv could not be loaded. This might be expected in some environments (e.g., hosting provider handles .env). Error: ", error.message);
  }
}

var admin = require("firebase-admin");

// Ensure all necessary environment variables are loaded before constructing serviceAccount
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // Ensure private_key is defined before calling .replace
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

// Validate that essential service account details are present
if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
  console.error(
    'Firebase Admin SDK Initialization Error: Missing critical service account details. ' +
    'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables are correctly set in your server environment.'
  );
  // Depending on your application's needs, you might throw an error here
  // or prevent further operations that depend on firebase-admin.
  // For example: throw new Error("Firebase Admin SDK not configured.");
} else {
  // Initialize Firebase Admin SDK only if it hasn't been initialized yet
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("Firebase Admin SDK initialization failed:", error);
      // throw error; // Optionally re-throw the error
    }
  } else {
    // console.log("Firebase Admin SDK was already initialized.");
    // You can get the default app if needed: admin.app()
  }
}

// Export the initialized admin instance for use in other server-side modules
module.exports = admin;