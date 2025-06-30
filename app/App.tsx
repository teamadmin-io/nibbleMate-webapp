import React, { useEffect } from 'react';
import { LogBox, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import AuthProvider, { useAuth } from './utils/contexts/AuthProvider';
import { validateToken, getSession } from './utils/features/auth/api';

// Disable specific warnings
LogBox.ignoreLogs([
  'We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320',
  'VirtualizedLists should never be nested inside plain ScrollViews',
  'Failed prop type: Invalid prop `color` supplied to `Text`'
]);

// Session validator that runs when app comes to foreground
function SessionValidator() {
  const { session, refreshSession, logout } = useAuth();
  
  useEffect(() => {
    // Function to validate current session when app is resumed
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Only check when app comes to foreground
      if (nextAppState === 'active' && session?.access_token) {
        console.log('🔐 App resumed - checking session validity');
        
        try {
          // First validate token client-side
          const isValid = await validateToken(session.access_token);
          
          if (!isValid) {
            console.log('🔐 Session invalid on app resume - attempting refresh');
            // Try to refresh the session
            const refreshed = await refreshSession(true);
            
            if (!refreshed) {
              console.log('🔐 Session refresh failed on app resume - logging out');
              // If refresh fails, log the user out
              logout();
            }
          }
        } catch (error) {
          console.error('🔐 Error validating session on app resume:', error);
        }
      }
    };
    
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Also check once on component mount
    const initialCheck = async () => {
      if (session?.access_token) {
        const isValid = await validateToken(session.access_token);
        if (!isValid) {
          console.log('🔐 Session invalid on initial check - attempting refresh');
          const refreshed = await refreshSession(true);
          if (!refreshed) {
            console.log('🔐 Session refresh failed on initial check - logging out');
            logout();
          }
        }
      }
    };
    
    initialCheck();
    
    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [session, refreshSession, logout]);
  
  return null; // This component doesn't render anything
}

export default function App() {
  // Load fonts
  const [loaded] = useFonts({
    ...Ionicons.font,
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SessionValidator />
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
} 