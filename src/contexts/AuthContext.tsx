import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { fetchUserProfile } from "../services/userService";
import { checkUserVerification } from "../services/verificationService";

export type UserRole = 'user' | 'admin' | 'verifier' | 'superuser';

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles: UserRole[];
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
  refreshVerificationStatus: async () => {},
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
    if (!userProfile || !userProfile.roles) return false;
    return userProfile.roles.includes(role);
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
          
          // Check verification status
          await refreshVerificationStatus();
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
        setVerificationStatus({ isVerified: false });
      }
      
      setLoading(false);
    });

    return unsubscribe;
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