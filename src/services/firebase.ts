import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCxBP2zuImfAz474zMKI6j8VoRdDxHtibM",
    authDomain: "visitix-ed209.firebaseapp.com",
    projectId: "visitix-ed209",
    storageBucket: "visitix-ed209.firebasestorage.app",
    messagingSenderId: "513905734617",
    appId: "1:513905734617:web:3a739f76ffd2aca9005fc8"
  };
// Ensure Firebase is initialized before using any services
if (!firebaseConfig.apiKey) {
    throw new Error("Firebase configuration is missing or invalid.");
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);