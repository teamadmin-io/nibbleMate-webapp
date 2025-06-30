import React from 'react'
import { Stack } from 'expo-router'
import { SafeAreaView, View } from 'react-native'
import AuthProvider from './utils/contexts/AuthProvider'
import Navbar from './components/Navbar'

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Navbar />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: 'white' }
          }} 
        />
      </SafeAreaView>
    </AuthProvider>
  )
}