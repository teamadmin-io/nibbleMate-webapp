import React, { useEffect } from 'react'
import { Text, View, useWindowDimensions, StyleSheet } from "react-native"
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/contexts/AuthProvider'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'

export default function HomePage(): JSX.Element {
  const { session, initialized } = useAuth()
  const router = useRouter()
  const { width } = useWindowDimensions()
  
  // Use responsive spacing based on screen size
  const isSmallScreen = width < 768
  const buttonMaxWidth = 300

  // Add debugging to track session state
  useEffect(() => {
    console.log('🏠 HomePage: Session state', { 
      initialized, 
      hasSession: !!session,
      sessionDetails: session ? {
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        expiresAt: new Date(session.expires_at * 1000).toISOString()
      } : 'No session'
    });
  }, [session, initialized]);

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.responsiveContentContainer}>
        <View style={styles.heroSection}>
          <Text style={[GlobalStyles.title, styles.heroTitle]}>Welcome to nibbleMate</Text>
          <Text style={[GlobalStyles.subtitle, styles.heroSubtitle]}>Your Cat's Food Journey Starts Here</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {session ? (
            <>
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Dashboard"
                  variant="primary"
                  onPress={() => router.push('/screens/Dashboard')}
                  style={{ maxWidth: buttonMaxWidth }}
                />
              </View>
              
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Profile"
                  onPress={() => router.push('/screens/ProfilePage')}
                  style={{ maxWidth: buttonMaxWidth }}
                />
              </View>
              
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Settings"
                  onPress={() => router.push('/screens/Settings')}
                  style={{ maxWidth: buttonMaxWidth }}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Sign In"
                  variant="primary"
                  onPress={() => router.push('/(auth)/sign-in')}
                  style={{ maxWidth: buttonMaxWidth }}
                />
              </View>
              
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Sign Up"
                  onPress={() => router.push('/(auth)/sign-up')}
                  style={{ maxWidth: buttonMaxWidth }}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heroSection: {
    width: '100%',
    alignItems: 'center' as const,
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center' as const,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center' as const,
    marginVertical: 8,
    maxWidth: 400,
  },
});