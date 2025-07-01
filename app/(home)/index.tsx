import React, { useEffect } from 'react'
import { Text, View, useWindowDimensions, StyleSheet } from "react-native"
import { useRouter } from 'expo-router'
import { useAuth } from '../utils/contexts/AuthProvider'
import { useDemo } from '../utils/contexts/DemoProvider'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'

export default function HomePage(): JSX.Element {
  const { session, initialized } = useAuth()
  const { isDemoMode, enterDemoMode } = useDemo()
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
      isDemoMode,
      sessionDetails: session ? {
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        expiresAt: new Date(session.expires_at * 1000).toISOString()
      } : 'No session'
    });
  }, [session, initialized, isDemoMode]);

  // Show signed-in UI if authenticated OR in demo mode
  const showSignedInUI = session || isDemoMode;

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.responsiveContentContainer}>
        <View style={styles.heroSection}>
          <Text style={[GlobalStyles.title, styles.heroTitle]}>Welcome to nibbleMate</Text>
          <Text style={[GlobalStyles.subtitle, styles.heroSubtitle]}>Your Cat's Food Journey Starts Here</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {showSignedInUI ? (
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
              
              <View style={styles.buttonWrapper}>
                <Button 
                  title="Try Demo Mode"
                  variant="secondary"
                  onPress={() => {
                    enterDemoMode();
                    router.replace('/(home)');
                  }}
                  style={{ 
                    maxWidth: buttonMaxWidth,
                    backgroundColor: '#fff3cd',
                    borderWidth: 0,
                    borderRadius: 9999,
                  }}
                  textStyle={{ color: '#856404', fontWeight: 'bold' }}
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