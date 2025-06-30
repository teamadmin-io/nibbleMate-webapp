import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useAuth } from '../utils/contexts/AuthProvider'
import { Text, View, ActivityIndicator } from 'react-native'

export default function HomeLayout() {
  const { session, initialized } = useAuth()
  
  // Log auth state for debugging
  useEffect(() => {
    console.log('🔒 HomeLayout: Auth state', { 
      initialized, 
      isAuthenticated: !!session 
    })
  }, [initialized, session])

  // Don't render anything until the auth is initialized
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 16 }}>Loading...</Text>
      </View>
    )
  }
  
  // Return the Stack regardless of auth state
  // The individual pages in (home) directory will handle showing
  // appropriate content based on auth state
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
      }} 
    />
  )
}