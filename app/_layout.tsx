import React from 'react'
import { Stack } from 'expo-router'
import { SafeAreaView, View } from 'react-native'
import AuthProvider from './utils/contexts/AuthProvider'
import { DemoProvider } from './utils/contexts/DemoProvider'
import Navbar from './components/Navbar'

export default function RootLayout() {
  return (
    <AuthProvider>
      <DemoProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Navbar />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              contentStyle: { backgroundColor: 'white' }
            }} 
          />
        </SafeAreaView>
      </DemoProvider>
    </AuthProvider>
  )
}