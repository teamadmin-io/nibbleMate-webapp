import React, { useMemo } from "react"
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, useWindowDimensions } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { useAuth } from '../utils/contexts/AuthProvider'
import { useDemo } from '../utils/contexts/DemoProvider'
import { useSignOutSelector } from '../utils/features/demo/hookSelector'
import GlobalStyles from '../../assets/styles/GlobalStyles'

export default function Navbar() {
  const router = useRouter()
  const { session, initialized } = useAuth()
  const { isDemoMode, exitDemoMode } = useDemo()
  const { signOut, loading: signingOut } = useSignOutSelector()
  const pathname = usePathname()
  const { width } = useWindowDimensions();
  
  // Check if we're on the profile page or dashboard
  const isProfilePage = pathname === '/screens/ProfilePage'
  const isDashboardPage = pathname === '/screens/Dashboard'
  const isHomePage = pathname === '/' || pathname === '/(home)'
  const isMobileWidth = width < 500;

  // Use memoized values to prevent unnecessary re-renders
  const navbarStyle = useMemo(() => {
    const baseStyle = GlobalStyles.navbar;
    // On mobile web, add extra padding to account for browser UI
    if (Platform.OS === 'web' && isMobileWidth) {
      return [
        baseStyle, 
        { paddingTop: 15, minHeight: 60, zIndex: 100 }
      ];
    }
    return baseStyle;
  }, [isMobileWidth]);
  
  // Don't show navigation elements until auth is initialized
  if (!initialized) {
    return (
      <View style={navbarStyle}>
        <Text style={GlobalStyles.navbarLogo}>nibbleMate</Text>
        <ActivityIndicator size="small" />
      </View>
    );
  }
  
  // Navigate to profile page
  const navigateToProfile = () => {
    router.push('/screens/ProfilePage');
  }
  
  // Navigate to sign in
  const navigateToSignIn = () => {
    router.push('/(auth)/sign-in');
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  }

  // Handle demo mode sign off
  const handleDemoSignOff = () => {
    exitDemoMode();
    router.push('/');
  }

  return (
    <View style={navbarStyle}>
      <TouchableOpacity onPress={() => router.push('/screens/Dashboard')}>
        <Text style={GlobalStyles.navbarLogo}>nibbleMate</Text>
        {isDemoMode && (
          <Text style={styles.demoBadge}>DEMO</Text>
        )}
      </TouchableOpacity>
      <View style={GlobalStyles.navLinks}>
        {isDemoMode ? (
          // Demo mode navigation options
          <>
            {/* Only hide Profile button on Profile page */}
            {!isProfilePage && (
              <TouchableOpacity 
                style={[styles.navButton, styles.profileButton]}
                onPress={navigateToProfile}
                activeOpacity={0.7}
              >
                <Text style={styles.profileButtonText}>Profile</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.navButton, styles.signOutButton]}
              onPress={handleDemoSignOff}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutButtonText}>Sign Off Demo</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Non-demo mode navigation options
          <>
            {session ? (
              // Authenticated user navigation options
              <>
                {/* Don't show Profile button on Profile page, Dashboard or home page */}
                {!isProfilePage && !isHomePage && !isDashboardPage && (
                  <TouchableOpacity 
                    style={[styles.navButton, styles.profileButton]}
                    onPress={navigateToProfile}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.profileButtonText}>Profile</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.navButton, styles.signOutButton]}
                  onPress={handleSignOut}
                  disabled={signingOut}
                  activeOpacity={0.7}
                >
                  {signingOut ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Non-authenticated user navigation options
              !pathname.includes('sign-in') && !pathname.includes('sign-up') && (
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={navigateToSignIn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonText}>Sign In</Text>
                </TouchableOpacity>
              )
            )}
          </>
        )}
      </View>
    </View>
  )
}

// Local styles for nav buttons
const styles = StyleSheet.create({
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  profileButton: {
    backgroundColor: "#f5f5f5",
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  signOutButton: {
    backgroundColor: "#ff3b30",
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  demoBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#ff6b35",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    overflow: 'hidden',
  }
});