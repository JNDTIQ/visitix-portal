import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { checkUserVerification } from "../services/verificationService";
import { db } from '../services/firebase'; // Import the db instance

export type UserRole = 'user' | 'admin' | 'verifier' | 'superuser';

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user'; // Simplified role for frontend
  metadata?: Record<string, any>;
}

interface VerificationStatus {
  isVerified: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  data?: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  verificationStatus: VerificationStatus;
  hasRole: (role: UserRole) => boolean;
  isVerifier: () => boolean;
  isAdmin: () => boolean;
  isSuperuser: () => boolean;
  refreshVerificationStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  verificationStatus: { isVerified: false },
  hasRole: () => false,
  isVerifier: () => false,
  isAdmin: () => false,
  isSuperuser: () => false,
  refreshVerificationStatus: async () => Promise.resolve(),
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({ isVerified: false });

  // Check if user has a specific role
  const hasRole = (role: UserRole): boolean => {
    if (!userProfile || !userProfile.role) return false;
    return userProfile.role === role;
  };

  // Convenience method to check if user is a verifier
  const isVerifier = (): boolean => {
    return hasRole('verifier') || hasRole('admin') || hasRole('superuser');
  };

  // Convenience method to check if user is an admin
  const isAdmin = (): boolean => {
    return hasRole('admin') || hasRole('superuser');
  };

  // New: Convenience method to check if user is a superuser
  const isSuperuser = (): boolean => {
    return hasRole('superuser');
  };
  
  // Method to refresh verification status
  const refreshVerificationStatus = async (): Promise<void> => {
    if (currentUser) {
      try {
        const status = await checkUserVerification(currentUser.uid);
        setVerificationStatus(status);
      } catch (error) {
        console.error("Error fetching verification status:", error);
      }
    }
  };

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeVerification: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user role from backend
        const token = await user.getIdToken();
        let role: 'admin' | 'user' = 'user';
        try {
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            role = data.role;
          }
        } catch (e) {
          // fallback: user
        }
        setUserProfile({
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          role
        });
        // --- Add Firestore listener for verification status ---
        const { doc, onSnapshot } = await import('firebase/firestore');
        const verificationDocRef = doc(db, 'userVerifications', user.uid);
        unsubscribeVerification = onSnapshot(verificationDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setVerificationStatus({
              isVerified: data.status === 'approved',
              status: data.status,
              data
            });
          } else {
            setVerificationStatus({ isVerified: false });
          }
        });
      } else {
        setUserProfile(null);
        setVerificationStatus({ isVerified: false });
        if (unsubscribeVerification) {
          unsubscribeVerification();
          unsubscribeVerification = null;
        }
      }
      setLoading(false);
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeVerification) {
        unsubscribeVerification();
      }
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    verificationStatus,
    hasRole,
    isVerifier,
    isAdmin,
    isSuperuser, // add to context
    refreshVerificationStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};