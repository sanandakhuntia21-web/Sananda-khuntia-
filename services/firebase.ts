import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Helper to safely parse config or return null
const getFirebaseConfig = () => {
  try {
    // Check global variable from environment injection (e.g. specialized runners)
    if (typeof (window as any).__firebase_config !== 'undefined') {
      return JSON.parse((window as any).__firebase_config);
    }
    // Check standard env var
    if (process.env.FIREBASE_CONFIG) {
        return JSON.parse(process.env.FIREBASE_CONFIG);
    }
    // Check individual env vars (fallback)
    if (process.env.REACT_APP_FIREBASE_API_KEY) {
        return {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID
        };
    }
  } catch (e) {
    console.error("Error parsing firebase config", e);
  }
  return null;
};

const config = getFirebaseConfig();

let app: any;
let auth: any;
let db: any;
const appId = (typeof (window as any).__app_id !== 'undefined') ? (window as any).__app_id : 'cinesphere-default';

if (config) {
  try {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(config);
    } else {
      app = firebase.app();
    }
    auth = firebase.auth();
    db = firebase.firestore();
  } catch (e) {
    console.error("Firebase init failed:", e);
  }
} else {
  console.warn("No Firebase configuration found. App will likely fail to load data.");
}

export { auth, db, appId };