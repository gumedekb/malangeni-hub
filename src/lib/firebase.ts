import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * Firebase client SDK setup.
 *
 * These values are the web app's public configuration (Firebase console >
 * Project settings > General > Your apps). They are not secrets — they name the
 * project, they don't grant access to it — so they live in the repo rather than
 * in env vars. Access is controlled by Firebase Auth and by the backend
 * verifying the ID token, not by hiding this snippet.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDqN5EexLv7Yu7ekxfRIxZzvfI0fmF19-w",
  authDomain: "malangeni-blog.firebaseapp.com",
  projectId: "malangeni-blog",
  storageBucket: "malangeni-blog.firebasestorage.app",
  messagingSenderId: "385229329914",
  appId: "1:385229329914:web:22a95e61c890f31a2ac043",
};

// Module state survives Fast Refresh and re-imports, and initialising the same
// app twice throws — so reuse the existing instance when there is one.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

/** Google is the only provider enabled on this project. */
export const googleProvider = new GoogleAuthProvider();
