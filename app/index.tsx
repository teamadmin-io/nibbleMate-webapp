import React, { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from './utils/contexts/AuthProvider';
import { useDemo } from './utils/contexts/DemoProvider';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Button from './components/Button';

export default function Index() {
  const router = useRouter();
  const { session, initialized } = useAuth();
  const { isDemoMode, enterDemoMode } = useDemo();
  const [showDemoOptions, setShowDemoOptions] = useState(false);
  
  // Debug logging for root redirection
  useEffect(() => {
    console.log('🔄 Root index.tsx: Auth state', { initialized, sessionExists: !!session, isDemoMode });
  }, [initialized, session, isDemoMode]);
  
  // Still initializing auth
  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If in demo mode, redirect to home
  if (isDemoMode) {
    return <Redirect href="/(home)" />;
  }

  // If authenticated, redirect to home
  if (session) {
    return <Redirect href="/(home)" />;
  }

  // Show demo options if not authenticated
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to NibbleMate</Text>
        <Text style={styles.subtitle}>Smart Cat Feeder Management</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Sign In"
            variant="primary"
            onPress={() => setShowDemoOptions(false)}
            style={styles.signInButton}
          />
          
          <Button
            title="Sign Up"
            variant="secondary"
            onPress={() => router.push('/(auth)/sign-up')}
            style={styles.signUpButton}
          />
          
          <Button
            title="Demo"
            variant="secondary"
            onPress={() => {
              enterDemoMode();
              setShowDemoOptions(true);
            }}
            style={styles.demoButton}
          />
        </View>

        {showDemoOptions && (
          <View style={styles.demoInfo}>
            <Text style={styles.demoTitle}>🎮 Demo Mode Features:</Text>
            <Text style={styles.demoText}>• Create up to 4 feeders and 4 cats</Text>
            <Text style={styles.demoText}>• Link cats to feeders</Text>
            <Text style={styles.demoText}>• Schedule feeding times</Text>
            <Text style={styles.demoText}>• Explore all app features</Text>
            <Text style={styles.demoText}>• Data resets when you exit demo</Text>
            <Text style={styles.demoNote}>No real data will be saved!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  demoButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
  },
  signInButton: {
    backgroundColor: '#000000',
  },
  signUpButton: {
    backgroundColor: '#808080',
  },
  demoInfo: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4caf50',
    width: '100%',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  demoText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  demoNote: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});