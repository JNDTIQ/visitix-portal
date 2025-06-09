import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { UserRole } from "../contexts/AuthContext";

const usersRef = collection(db, "users");

// Create a new user profile
export const createUserProfile = async (uid: string, profileData: any) => {
  const userDoc = doc(db, "users", uid);
  
  // Ensure the user has at least the basic role
  if (!profileData.roles || !profileData.roles.length) {
    profileData.roles = ['user'];
  }
  
  return await setDoc(userDoc, profileData);
};

// Fetch a user's profile
export const fetchUserProfile = async (uid: string) => {
  const userDoc = doc(db, "users", uid);
  const snapshot = await getDoc(userDoc);
  return snapshot.exists() ? snapshot.data() : null;
};

// Add a role to a user
export const addUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const userDoc = doc(db, "users", uid);
  return await updateDoc(userDoc, {
    roles: arrayUnion(role)
  });
};

// Remove a role from a user
export const removeUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const userDoc = doc(db, "users", uid);
  return await updateDoc(userDoc, {
    roles: arrayRemove(role)
  });
};

// Assign a user as a ticket verifier
export const assignVerifierRole = async (uid: string): Promise<void> => {
  return await addUserRole(uid, 'verifier');
};

// Revoke ticket verifier permissions
export const revokeVerifierRole = async (uid: string): Promise<void> => {
  return await removeUserRole(uid, 'verifier');
};

// Check if user has verifier permissions
export const isUserVerifier = async (uid: string): Promise<boolean> => {
  const profile = await fetchUserProfile(uid);
  
  if (!profile || !profile.roles) {
    return false;
  }
  
  return profile.roles.includes('verifier') || profile.roles.includes('admin');
};

// The purpose of this file is to manage user profile data in Firestore.
// It includes functions to create a user profile and fetch a user profile based on the user's UID.
// It also includes functions to manage user roles, such as adding or removing roles, and checking permissions.