import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { getSession, refreshSession, validateToken, signOut } from '../features/auth/api';
import { Alert, Platform } from 'react-native';

// Define the session type
type SessionType = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

// Define the auth context type
type AuthContextType = {
  session: SessionType | null;
  initialized: boolean;
  refreshing: boolean;
  refreshSession: (forceReload?: boolean) => Promise<boolean>;
  clearSession: () => void;
  navigate: (path: string) => void;
  setSessionState: (newSession: SessionType | null) => void;
  logout: () => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  initialized: false,
  refreshing: false,
  refreshSession: async () => false,
  clearSession: () => {},
  navigate: () => {},
  setSessionState: () => {},
  logout: async () => {}
});

// Auth Provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionType | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoLogoutAttempted, setAutoLogoutAttempted] = useState(false);

  // Debug function for auth
  const authDebug = (action: string, details?: any) => {
    console.log(`🔐 Auth: ${action}`, details || '');
  };

  // Manual session state setter for external updates
  const setSessionState = useCallback((newSession: SessionType | null) => {
    authDebug('External session state update', { hasSession: !!newSession });
    setSession(newSession);
  }, []);

  // Handle logout flow
  const logout = useCallback(async () => {
    authDebug('Logging out user');
    try {
      // Call signOut API to invalidate the session on the server
      await signOut();
    } catch (error) {
      authDebug('Error during logout API call', { error });
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local session
      setSession(null);
      // Navigate to login screen
      router.replace('/login' as any);
    }
  }, []);

  // Handle automatic logout when session is invalid
  const handleInvalidSession = useCallback((reason: string) => {
    if (autoLogoutAttempted) return; // Prevent multiple logout attempts
    setAutoLogoutAttempted(true);
    
    authDebug(`Auto logout triggered: ${reason}`);
    
    // Show alert on native platforms
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [{ text: 'OK', onPress: logout }]
      );
    } else {
      // On web, just log out and redirect
      logout();
    }
  }, [logout, autoLogoutAttempted]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        authDebug('Initializing auth');
        const storedSession = await getSession();
        
        if (storedSession) {
          // Validate the token
          const isValid = await validateToken(storedSession.access_token);
          
          if (isValid) {
            authDebug('Session restored and validated', { 
              hasAccessToken: !!storedSession.access_token,
              userId: storedSession.user_id 
            });
            setSession(storedSession);
          } else {
            authDebug('Session token invalid, attempting refresh');
            
            // Try to refresh the token
            const refreshed = await refreshSession(storedSession.refresh_token);
            
            if (refreshed) {
              authDebug('Session refreshed successfully');
              setSession(refreshed);
            } else {
              authDebug('Session refresh failed, clearing session');
              // Handle invalid session after refresh failure
              setSession(null);
              if (initialized) {
                handleInvalidSession('Refresh failed during initialization');
              }
            }
          }
        } else {
          authDebug('No session found');
          setSession(null);
        }
      } catch (error) {
        authDebug('Error initializing auth', { error });
        setSession(null);
      } finally {
        setInitialized(true);
        setAutoLogoutAttempted(false); // Reset for future checks
      }
    };

    initializeAuth();
  }, [handleInvalidSession, initialized]);

  // Re-check session from storage when needed
  const recheckSession = useCallback(async () => {
    authDebug('Re-checking session from storage');
    try {
      const currentSession = await getSession();
      if (currentSession) {
        // Validate token during recheck
        const isValid = await validateToken(currentSession.access_token);
        if (!isValid) {
          authDebug('Found invalid session during recheck');
          handleInvalidSession('Invalid token during recheck');
          return false;
        }
        
        authDebug('Found valid session in storage during recheck');
        setSession(currentSession);
        return true;
      } else {
        authDebug('No session found during recheck');
        setSession(null);
        return false;
      }
    } catch (error) {
      authDebug('Error during session recheck', { error });
      return false;
    }
  }, [handleInvalidSession]);
  
  // Re-check session periodically
  useEffect(() => {
    // Check once on first load after initialization
    if (initialized && !session) {
      recheckSession();
    }
    
    // Set up a periodic check - increased to 5 minutes for better performance
    // but still frequently enough to catch expiration issues
    const checkInterval = setInterval(() => {
      if (initialized) {
        recheckSession();
      }
    }, 300000); // Check every 5 minutes instead of 30 seconds
    
    return () => clearInterval(checkInterval);
  }, [initialized, recheckSession, session]);

  // Function to refresh the session
  const refreshSessionCallback = useCallback(async (forceReload: boolean = false) => {
    if (!session && !forceReload) return false;
    
    setRefreshing(true);
    try {
      authDebug('Manually refreshing session');
      
      // First try to get the current session again
      const currentSession = await getSession();
      
      if (currentSession) {
        // If the session is still valid, just update our state
        const isValid = await validateToken(currentSession.access_token);
        
        if (isValid && !forceReload) {
          authDebug('Current session still valid');
          setSession(currentSession);
          return true;
        }
        
        // Try to refresh with the refresh token
        authDebug('Refreshing with token');
        const refreshed = await refreshSession(currentSession.refresh_token);
        
        if (refreshed) {
          authDebug('Session refreshed successfully');
          setSession(refreshed);
          return true;
        } else {
          authDebug('Session refresh failed');
          // Don't immediately clear the session - keep trying with existing token
          // This helps prevent users from being logged out unnecessarily
          if (isValid) {
            authDebug('Keeping current valid session despite refresh failure');
            return true;
          }
          
          // If not valid and refresh failed, handle invalid session
          handleInvalidSession('Refresh failed and token invalid');
          setSession(null);
          return false;
        }
      } else {
        authDebug('No session to refresh');
        setSession(null);
        return false;
      }
    } catch (error) {
      authDebug('Error refreshing session', { error });
      // Try to validate the current session before clearing it
      if (session) {
        try {
          const isValid = await validateToken(session.access_token);
          if (isValid) {
            authDebug('Keeping current session despite refresh error');
            return true;
          }
        } catch (e) {
          authDebug('Current session invalid after refresh error');
        }
      }
      
      // If validation fails or errors, handle invalid session
      handleInvalidSession('Error during refresh');
      setSession(null);
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [session, handleInvalidSession]);

  // Function to clear the session from state
  const clearSession = useCallback(() => {
    authDebug('Clearing session from AuthProvider state');
    setSession(null);
  }, []);

  // Navigation helper that respects auth state
  const navigate = useCallback((path: string) => {
    authDebug('Navigating with auth context', { path, hasSession: !!session });
    // Use any type to bypass the router type checking
    router.replace(path as any);
  }, [session]);

  // Reset auto-logout flag when session changes
  useEffect(() => {
    setAutoLogoutAttempted(false);
  }, [session]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    session,
    initialized,
    refreshing,
    refreshSession: refreshSessionCallback,
    clearSession,
    navigate,
    setSessionState,
    logout
  }), [session, initialized, refreshing, refreshSessionCallback, clearSession, navigate, setSessionState, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export a memoized version of the provider
export default React.memo(AuthProvider); 