import { db } from "./firebase";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";

const usersRef = collection(db, "users");

export const createUserProfile = async (uid: string, profileData: any) => {
  const userDoc = doc(db, "users", uid);
  return await setDoc(userDoc, profileData);
};

export const fetchUserProfile = async (uid: string) => {
  const userDoc = doc(db, "users", uid);
  const snapshot = await getDoc(userDoc);
  return snapshot.exists() ? snapshot.data() : null;
};


// The purpose of this file is to manage user profile data in Firestore.
// It includes functions to create a user profile and fetch a user profile based on the user's UID.