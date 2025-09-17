import Constants from "expo-constants";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey:
    Constants.expoConfig?.extra?.firebaseApiKey ||
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    Constants.expoConfig?.extra?.firebaseAuthDomain ||
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:
    Constants.expoConfig?.extra?.firebaseProjectId ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    Constants.expoConfig?.extra?.firebaseStorageBucket ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    Constants.expoConfig?.extra?.firebaseMessagingSenderId ||
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    Constants.expoConfig?.extra?.firebaseAppId ||
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  // Optional: Add these if you're using additional Firebase services
  databaseURL:
    Constants.expoConfig?.extra?.firebaseDatabaseUrl ||
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  measurementId:
    Constants.expoConfig?.extra?.firebaseMeasurementId ||
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase configuration
const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missingKeys = requiredKeys.filter(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingKeys.length > 0) {
  console.error("🚨 Missing Firebase configuration keys:", missingKeys);
  console.error(
    "📝 Please check your environment variables and ensure all required Firebase configuration values are set."
  );
  console.error(
    "📖 See ENVIRONMENT_VARIABLES_SETUP.md for the required format."
  );

  // Enhanced debugging for production
  if (!__DEV__) {
    console.log("🚨 PRODUCTION: Firebase Config Debug:", {
      missingKeys,
      hasConstants: !!Constants.expoConfig?.extra,
      configKeys: Object.keys(firebaseConfig),
      timestamp: new Date().toISOString(),
    });
  }
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);

export { auth, firebaseConfig };
export default app;
