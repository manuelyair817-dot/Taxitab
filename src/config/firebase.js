import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "taxitab-xxxx.firebaseapp.com",
  projectId: "taxitab-xxxx",
  storageBucket: "taxitab-xxxx.appspot.com",
  messagingSenderId: "XXXXX",
  appId: "XXXXX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);