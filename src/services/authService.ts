import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    updateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    User
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  // Interface for authentication errors
  export interface AuthError {
    code: string;
    message: string;
  }
  
  // Register a new user
  export const registerUser = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Login an existing user
  export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Logout current user
  export const logoutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Send password reset email
  export const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Update user profile
  export const updateUserProfile = async (user: User, displayName: string): Promise<void> => {
    try {
      await updateProfile(user, { displayName });
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Update user email
  export const updateUserEmail = async (user: User, newEmail: string): Promise<void> => {
    try {
      await updateEmail(user, newEmail);
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Update user password
  export const updateUserPassword = async (user: User, newPassword: string): Promise<void> => {
    try {
      await updatePassword(user, newPassword);
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Reauthenticate user (required for sensitive operations)
  export const reauthenticateUser = async (user: User, password: string): Promise<void> => {
    try {
      const credential = EmailAuthProvider.credential(user.email || '', password);
      await reauthenticateWithCredential(user, credential);
    } catch (error) {
      throw handleAuthError(error);
    }
  };
  
  // Helper function to handle Firebase auth errors
  const handleAuthError = (error: any): AuthError => {
    const authError: AuthError = {
      code: error.code || 'auth/unknown-error',
      message: error.message || 'An unknown authentication error occurred'
    };
    
    // You could add custom error messages here based on error codes
    switch (authError.code) {
      case 'auth/invalid-credential':
        authError.message = 'Invalid email or password';
        break;
      case 'auth/user-not-found':
        authError.message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        authError.message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        authError.message = 'This email is already registered';
        break;
      case 'auth/weak-password':
        authError.message = 'Password should be at least 6 characters';
        break;
      case 'auth/requires-recent-login':
        authError.message = 'Please login again before performing this operation';
        break;
    }
    
    return authError;
  };