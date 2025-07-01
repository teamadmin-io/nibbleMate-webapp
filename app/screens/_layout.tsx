import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useAuth } from '../utils/contexts/AuthProvider'
import { useDemo } from '../utils/contexts/DemoProvider'
import { Text, View, ActivityIndicator } from 'react-native'

export default function ScreensLayout() {
  const { session, initialized } = useAuth()
  const { isDemoMode } = useDemo()
  const router = useRouter()

  // Check if user is authenticated whenever this component renders
  // or when session changes
  useEffect(() => {
    console.log('🔒 ScreensLayout: Checking auth state', { 
      initialized, 
      isAuthenticated: !!session, 
      isDemoMode
    })
    
    if (initialized && !session && !isDemoMode) {
      console.log('🔒 ScreensLayout: User is not authenticated, redirecting to home page')
      // Send to home page instead of directly to sign-in, so user sees the home UI with sign-in button
      router.replace('/(home)')
    }
  }, [initialized, session, isDemoMode, router])

  // Don't render anything until the auth is initialized
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 16 }}>Loading...</Text>
      </View>
    )
  }

  // Don't render the screens if not authenticated
  if (!session && !isDemoMode) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please sign in to access this page</Text>
        <View style={{ marginTop: 20 }}>
          <Text 
            style={{ color: 'blue', textDecorationLine: 'underline' }}
            onPress={() => router.replace('/(home)')}
          >
            Return to Home
          </Text>
        </View>
      </View>
    )
  }
  
  // Return the Stack if authenticated
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
      }} 
    />
  )
} 