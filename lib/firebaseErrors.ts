// lib/firebaseErrors.ts

export const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'The email address is already in use by another account.';
    
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    
    case 'auth/weak-password':
      return 'The password is too weak.';
    
    case 'auth/user-disabled':
      return 'The user account has been disabled by an administrator.';
    
    case 'auth/user-not-found':
      return 'There is no user record corresponding to this identifier.';
    
    case 'auth/wrong-password':
      return 'The password is invalid or the user does not have a password.';
    
    case 'auth/invalid-credential':
      return 'The credentials are invalid or expired. Please try again.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    case 'auth/too-many-requests':
      return 'Too many requests. Please try again later.';
    
    default:
      console.error('Unhandled Firebase Auth Error:', errorCode);
      return 'An unknown error occurred. Please try again.';
  }
};
