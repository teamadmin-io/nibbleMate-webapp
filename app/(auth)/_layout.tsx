import React, { useEffect } from 'react'
import { Stack, Redirect } from 'expo-router'
import { useAuth } from '../utils/contexts/AuthProvider'
import { View, Text, ActivityIndicator } from 'react-native'

export default function AuthLayout() {
  const { session, initialized } = useAuth()

  useEffect(() => {
    console.log('🔐 AuthLayout: Auth state updated', { 
      initialized, 
      isAuthenticated: !!session 
    })
    
    if (initialized && session) {
      console.log('🔐 AuthLayout: User is authenticated, should redirect to home')
    }
  }, [initialized, session])

  // Show loading until auth is initialized
  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 16 }}>Loading authentication...</Text>
      </View>
    )
  }

  // Redirect to home if the user is already authenticated
  if (session) {
    console.log('🔐 AuthLayout: Redirecting to home due to active session')
    return <Redirect href="/(home)" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#000000',
      }}
    />
  )
}