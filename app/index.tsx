import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from './utils/contexts/AuthProvider';
import { View, Text, ActivityIndicator } from 'react-native';
import CustomTextInput from './components/CustomTextInput';

export default function Index() {
  const { session, initialized } = useAuth();
  
  // Debug logging for root redirection
  useEffect(() => {
    console.log('🔄 Root index.tsx: Auth state', { initialized, sessionExists: !!session });
    console.log('🔄 Root index.tsx: Redirecting to home page regardless of auth status');
  }, [initialized, session]);
  
  // Still initializing auth
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }
  
  // Always redirect to home page, which will show the appropriate UI based on auth state
  return <Redirect href="/(home)" />;
}