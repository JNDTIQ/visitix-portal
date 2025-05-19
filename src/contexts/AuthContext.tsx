import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { fetchUserProfile } from "../services/userService";

export type UserRole = 'user' | 'admin' | 'verifier';

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles: UserRole[];
  metadata?: Record<string, any>;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  isVerifier: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  hasRole: () => false,
  isVerifier: () => false,
  isAdmin: () => false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    if (!userProfile || !userProfile.roles) return false;
    return userProfile.roles.includes(role);
  };

  // Convenience method to check if user is a verifier
  const isVerifier = (): boolean => {
    return hasRole('verifier') || hasRole('admin');
  };

  // Convenience method to check if user is an admin
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile data from Firestore
        try {
          const profileData = await fetchUserProfile(user.uid);
          
          if (profileData) {
            // Set default roles if none exist
            if (!profileData.roles) {
              profileData.roles = ['user'];
            }
            
            setUserProfile(profileData as UserProfile);
          } else {
            // Create a basic profile if none exists
            setUserProfile({
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || undefined,
              photoURL: user.photoURL || undefined,
              roles: ['user']
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Set a basic profile with user role as fallback
          setUserProfile({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
            roles: ['user']
          });
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    hasRole,
    isVerifier,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};