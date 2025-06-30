import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as apiSignOut,
  verifyEmail as apiVerifyEmail,
  getUserInfo,
  updateUsername as apiUpdateUsername
} from './api';
import { AuthFormData } from './types';
import { safeApiCall } from '../../helpers/errors';
import { useAuth } from '../../contexts/AuthProvider';

/**
 * Hook for user sign in
 */
export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setSessionState } = useAuth();

  const signIn = async (formData: AuthFormData) => {
    setLoading(true);
    
    try {
      console.log('🔑 Starting signIn in hooks.ts');
      const result = await signInWithEmail(formData);
      console.log('🔑 signIn result:', { success: !!result });
      
      // Explicitly update the auth provider with the new session
      if (result && result.session) {
        console.log('🔑 Explicitly updating AuthProvider with new session');
        setSessionState(result.session);
        
        // Give time for the state to update before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        router.replace('/(home)');
      }
      return result;
    } catch (error) {
      console.error('❌ [SignIn hook] Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
};

/**
 * Hook for user sign up
 */
export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setSessionState } = useAuth();

  const signUp = async (formData: AuthFormData) => {
    setLoading(true);
    
    try {
      console.log('📝 Starting signUp in hooks.ts');
      const response = await signUpWithEmail(formData);
      console.log('📝 signUp result:', response);
      
      // If we got back a session, update auth provider
      if (response && response.session) {
        console.log('📝 Updating AuthProvider with new session from sign-up');
        setSessionState(response.session);
        
        // Give time for the state to update before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Redirect to sign-in with a parameter
      router.replace('/(auth)/sign-in');
      
      return response;
    } catch (error) {
      console.error('❌ [SignUp hook] Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading };
};

/**
 * Hook for user sign out
 */
export const useSignOut = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { clearSession } = useAuth();

  const signOut = async () => {
    setLoading(true);
    
    console.log('🔐 Auth: Starting sign out process');
    
    try {
      await apiSignOut();
      console.log('🔐 Auth: Sign out API call completed');
      
      // Clear the session in the auth provider
      clearSession();
      
      // Give a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to home page
      console.log('🔐 Auth: Redirecting after sign out');
      router.replace('/(home)');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      Alert.alert('Sign Out Error', 'There was a problem signing out. Please try again.');
      
      // Still clear local state even if API call fails
      clearSession();
      router.replace('/(home)');
    } finally {
      setLoading(false);
    }
  };

  return { signOut, loading };
};

/**
 * Hook for email verification
 */
export const useVerifyEmail = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const verifyEmail = async (token: string, email?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiVerifyEmail(token, email);
      setSuccess(true);
      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      setError(error instanceof Error ? error : new Error('Failed to verify email'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { verifyEmail, loading, success, error };
};

/**
 * Type for user info
 */
type UserInfoType = Record<string, any> | null;

/**
 * Hook for fetching user info
 */
export const useUserInfo = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoType>(null);
  const [error, setError] = useState<Error | null>(null);
  const { session, refreshSession } = useAuth();
  
  const fetchUserInfo = useCallback(async () => {
    if (!session) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const info = await getUserInfo();
      
      if (info) {
        setUserInfo(info);
        return info;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      
      // Try refreshing the session on auth errors
      try {
        const refreshed = await refreshSession();
        if (refreshed) {
          const retryInfo = await getUserInfo();
          if (retryInfo) {
            setUserInfo(retryInfo);
            return retryInfo;
          }
        }
      } catch (refreshError) {
        console.error('Refresh attempt failed:', refreshError);
      }
      
      setError(error instanceof Error ? error : new Error('Failed to fetch user info'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, refreshSession]);
  
  // Fetch user info when the session changes
  useEffect(() => {
    if (session) {
      fetchUserInfo();
    } else {
      setUserInfo(null);
    }
  }, [session, fetchUserInfo]);
  
  return { userInfo, loading, error, refetch: fetchUserInfo };
};

/**
 * Hook for managing user profile
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    username?: string;
    updated_at?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user info from the API
      const userInfo = await getUserInfo();
      
      if (!userInfo) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Set the profile data
      setProfile({
        id: userInfo.id,
        email: userInfo.email,
        username: userInfo.username,
        updated_at: userInfo.updated_at
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('[Profile Error]:', err);
      setError(err instanceof Error ? err : new Error(errorMessage));
      Alert.alert('Error', 'Error loading profile');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateUsername = async (username: string) => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return false;
    }
    
    setLoading(true);
    
    try {
      // Call the API function to update the username
      const updatedProfile = await apiUpdateUsername(username);
      
      if (updatedProfile) {
        // Update the local profile state with the new data
        setProfile({
          id: updatedProfile.id,
          email: updatedProfile.email,
          username: updatedProfile.username,
          updated_at: updatedProfile.updated_at
        });
        
        return true;
      }
      
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      console.error('[Update Profile Error]:', err);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateUsername
  };
};

/**
 * Hook for profile editing
 */
export const useProfileEditor = (initialUsername: string = '') => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(initialUsername);
  
  // Begin editing the username
  const startEditing = (username: string = '') => {
    setEditedUsername(username);
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditedUsername('');
  };
  
  return {
    isEditing,
    editedUsername,
    setEditedUsername,
    startEditing,
    cancelEditing
  };
};