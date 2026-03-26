import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4uMnbUElYXgrXrDHOQl1daJ3gAUb2y04",
  authDomain: "taxitab-v2.firebaseapp.com",
  projectId: "taxitab-v2",
  storageBucket: "taxitab-v2.firebasestorage.app",
  messagingSenderId: "209663750833",
  appId: "1:209663750833:web:bd49257fab628dd9446890"
};

// Inicializamos la app
const app = initializeApp(firebaseConfig);

// Exportamos los servicios para que RegistroScreen los pueda usar
export const auth = getAuth(app);
export const db = getFirestore(app);