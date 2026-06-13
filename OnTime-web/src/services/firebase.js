import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// FIXED: Hardcoded strings bypass the browser extension environment block entirely
const firebaseConfig = {
  apiKey: "AIzaSyBq2Q2_1ZCmT-xwJvuSq1w3ugGAfALv_8A",
  authDomain: "ontime-df19b.firebaseapp.com",
  projectId: "ontime-df19b",
  storageBucket: "ontime-df19b.firebasestorage.app",
  messagingSenderId: "168959223360",
  appId: "1:168959223360:web:1802173447c1ed107621a5"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;