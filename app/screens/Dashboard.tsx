import React from 'react'
import { Text, View, StyleSheet, Image, useWindowDimensions, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'

const Dashboard = (): JSX.Element => {
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  
  // Use responsive spacing based on screen size
  const isSmallScreen = width < 768
  const isMobileBrowser = Platform.OS === 'web' && isSmallScreen
  const isMobile = Platform.OS !== 'web' || isMobileBrowser;
  const buttonMaxWidth = isSmallScreen ? '100%' : 300
  
  // Calculate safe area padding for mobile browsers
  const statusBarHeight = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0)
  // Reduce top padding for mobile web and native
  const topPadding = isMobile ? 24 : (isMobileBrowser ? 24 : statusBarHeight)

  // Dynamic styles for compactness on mobile
  const headerStyle = [
    styles.header,
    isMobile && { paddingTop: 8, marginBottom: 18 }, // less space above/below title
  ];
  const cardsContainerStyle = [
    styles.cardsContainer,
    isMobile && { gap: 12 }, // reduce gap between cards
  ];

  return (
    <SafeAreaView style={[GlobalStyles.container, styles.safeArea]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingTop: topPadding } // Dynamic padding based on platform
        ]}
        showsVerticalScrollIndicator={true}
      >
        <View style={GlobalStyles.responsiveContentContainer}>
          <View style={headerStyle}>
            <Text style={[GlobalStyles.title, styles.title]}>Dashboard</Text>
            <Text style={[GlobalStyles.subtitle, styles.subtitle]}>Manage your pets and feeders</Text>
          </View>
          
          <View style={cardsContainerStyle}>
            {/* Feeders Card */}
            <View style={[GlobalStyles.card, styles.card]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Feeders</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                Set up and manage your pet feeders. Configure schedules, and monitor feeding activity.
              </Text>
              
              <View style={styles.spacer} />
              
              <Button 
                title="Go to Feeders"
                variant="primary"
                onPress={() => router.push('/screens/MainPage')}
                style={{ maxWidth: buttonMaxWidth }}
              />
            </View>
            
            {/* Cats Card */}
            <View style={[GlobalStyles.card, styles.card]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Cats</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                View your cats' profiles, track their weight, and monitor feeding history.
              </Text>
              
              <View style={styles.spacer} />
              
              <Button 
                title="Go to Cats"
                variant="primary"
                onPress={() => router.push('/screens/CatPage')}
                style={{ maxWidth: buttonMaxWidth }}
              />
            </View>
          </View>
          
          {/* Added padding at bottom for better scrolling experience */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 50, // Extra padding at the bottom for scrolling
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 30,
    width: '100%',
    paddingTop: 20, // Extra padding for header
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 30,
  },
  cardsContainer: {
    width: '100%',
    flexDirection: 'column' as const, // Column layout for mobile 
    justifyContent: 'center' as const,
    gap: 20,
  },
  card: {
    width: '100%',
    minWidth: 280,
    margin: 10,
    alignItems: 'center' as const,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    marginBottom: 25, // Increased spacing between cards
  },
  cardHeader: {
    width: '100%',
    alignItems: 'center' as const,
    marginBottom: 16,
    justifyContent: 'center' as const,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  cardIcon: {
    width: 30,
    height: 30,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  bottomPadding: {
    height: 50, // Extra space at the bottom of the content
  }
});

export default Dashboard