import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import { useFeeders } from '../utils/features/feeders/hooks';
import { fetchAllCats } from '../utils/features/cats/api';
import { formatHardwareIdForDisplay, getFeederDisplayName } from '../utils/helpers/feederHelpers';
import { triggerFeedNow } from '../utils/features/feeders/api';
import { showFeedback, ModalType } from '../utils/helpers/feedbackHelpers';
import FeedbackModal from '../components/FeedbackModal';

// Define Cat type since we're not importing it
interface Cat {
  catid: number;
  catname: string;
  feederid: number | null;
}

// Optimize MainPage component
const MainPage = React.memo((): JSX.Element => {
  const router = useRouter();
  const { feeders, loading, refetch } = useFeeders();
  const { width } = useWindowDimensions();
  
  // Local state for cats data
  const [cats, setCats] = useState<Cat[]>([]);
  const [fetchingCats, setFetchingCats] = useState(false);
  
  // Add modal state for web feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>(ModalType.SUCCESS);
  
  // Fetch all cats data - memoized to prevent recreation on each render
  const fetchCats = useCallback(async () => {
    try {
      setFetchingCats(true);
      const catsData = await fetchAllCats();
      setCats(Array.isArray(catsData) ? catsData : []);
    } catch (error) {
      setCats([]);
    } finally {
      setFetchingCats(false);
    }
  }, []);
  
  // Helper function to find a cat by feeder ID - memoized
  const findCatByFeederId = useCallback((feederId: number): Cat | null => {
    if (!cats || !Array.isArray(cats) || cats.length === 0) return null;
    return cats.find(cat => cat.feederid === feederId) || null;
  }, [cats]);
  
  // Sort feeders: named feeders alphabetically first, then unnamed feeders by number - memoized
  const sortedFeeders = useMemo(() => {
    if (!feeders) return [];
    
    return [...feeders].sort((a, b) => {
      // If both have names, sort alphabetically
      if (a.name && b.name) {
        return a.name.localeCompare(b.name);
      }
      
      // Named feeders come before unnamed feeders
      if (a.name) return -1;
      if (b.name) return 1;
      
      // For unnamed feeders, sort by their ID
      return a.id - b.id;
    });
  }, [feeders]);
  
  // Calculate responsive layout values - memoized to prevent recalculation on every render
  const layoutValues = useMemo(() => {
    // Define breakpoints for different device sizes
    const mobileBreakpoint = 600;
    const tabletBreakpoint = 1024;
    const desktopBreakpoint = 1440;
    
    const isSmallScreen = width < mobileBreakpoint;
    const isMobileWeb = Platform.OS === 'web' && width < mobileBreakpoint;
    
    // Set fixed card width for proper rendering
    const minCardWidth = 280; // Minimum width in pixels for a good looking card
    
    // Calculate number of columns based on available width
    const numColumns = width < mobileBreakpoint ? 1 : width < tabletBreakpoint ? 2 : 3;
    
    // Calculate content width (in pixels)
    const contentWidth = width < 1200 ? width : 1200;
    
    // Calculate card width as proportion (not percentage string)
    const cardWidthPercent = numColumns === 1 ? 1 : 
                             numColumns === 2 ? 0.48 : 
                             0.31;
    
    // For very small screens, maintain minimum width and allow horizontal scrolling
    const useScrolling = width < 360; // iOS smallest width ~320px
    
    // Calculate actual pixel width for fixed width scenarios
    const cardWidthPercentage = isSmallScreen ? width : 
                              numColumns === 2 ? width * 0.48 : 
                              width * 0.31;
    
    // Pre-compute grid centering condition based on number of items
    const gridRowCenteredCondition = (feeders?.length || 0) < numColumns;
    
    return { 
      isSmallScreen, 
      isMobileWeb,
      contentWidth, 
      numColumns, 
      cardWidthPercentage,
      cardWidthPercent,
      minCardWidth,
      useScrolling,
      gridRowCenteredCondition
    };
  }, [width, feeders?.length]);
  
  // Helper function to show feedback - memoized
  const handleShowFeedback = useCallback((title: string, message: string, type: ModalType) => {
    showFeedback(
      title, 
      message, 
      type, 
      setShowFeedbackModal, 
      setModalTitle, 
      setModalMessage, 
      setModalType
    );
  }, []);
  
  // Handle Feed Now action - memoized
  const handleFeedNow = useCallback(async (feederId: number, calories: number) => {
    try {
      await triggerFeedNow(feederId, calories);
      handleShowFeedback(
        "Success",
        "Feed command sent successfully!",
        ModalType.SUCCESS
      );
    } catch (error) {
      handleShowFeedback(
        "Error",
        "Failed to send feed command. Please try again.",
        ModalType.ERROR
      );
    }
  }, [handleShowFeedback]);
  
  // Fetch initial data
  useEffect(() => {
    fetchCats();
  }, [fetchCats]);
  
  // Refresh all data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // This will run when the screen is focused
      const refreshData = async () => {
        await Promise.all([
          refetch(),
          fetchCats()
        ]);
      };
      
      refreshData();
      
      return () => {
        // This will run when the screen is unfocused
      };
    }, [refetch, fetchCats])
  );
  
  // Navigation callbacks - memoized
  const goBack = useCallback(() => {
    router.back();
  }, [router]);
  
  const navigateToCreateFeeder = useCallback(() => {
    router.push('/screens/CreateFeeder');
  }, [router]);
  
  // Modal dismiss callback - memoized
  const handleModalDismiss = useCallback(() => {
    setShowFeedbackModal(false);
  }, []);
  
  // Extract NoFeedersView as a memoized component
  const NoFeedersView = React.memo(() => (
    <View style={styles.noFeedersContainer}>
      <Text style={styles.noFeedersText}>
        You don't have any feeders linked to your account yet.
      </Text>
      <Text style={styles.noFeedersSubtext}>
        Create a new feeder or link an existing one from your profile.
      </Text>
    </View>
  ));
  
  // Add display name for debugging
  NoFeedersView.displayName = 'NoFeedersView';
  
  // FeederCard component - memoized to prevent unnecessary re-renders
  const FeederCard = React.memo(({ item, index }: { item: any, index: number }) => {
    const associatedCat = findCatByFeederId(item.id);
    
    // Navigate to Scheduler - memoized
    const navigateToScheduler = useCallback(() => {
      router.push({
        pathname: '/screens/Scheduler',
        params: { 
          feederId: item.id,
          feederName: item.name || `Feeder ${index + 1}` 
        }
      });
    }, [router, item.id, item.name, index]);
    
    // Navigate to cat details - memoized
    const navigateToCatDetails = useCallback(() => {
      if (associatedCat) {
        router.push({
          pathname: '/screens/CatDetailsPage/[catid]',
          params: { catid: associatedCat.catid.toString() },
        });
      }
    }, [router, associatedCat]);
    
    const confirmFeedNow = useCallback(() => {
      const calories = item.manual_feed_calories || 20; // Default to 20 if not set
      
      if (Platform.OS === 'web') {
        handleShowFeedback(
          "Confirm Feeding",
          `Are you sure you want to dispense ${calories} calories now?`,
          ModalType.INFO
        );
        // For now, just proceed with feeding
        handleFeedNow(item.id, calories);
      } else {
        Alert.alert(
          "Confirm Feeding",
          `Are you sure you want to dispense ${calories} calories now?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Feed", onPress: () => handleFeedNow(item.id, calories) }
          ]
        );
      }
    }, [item.id, item.manual_feed_calories, handleShowFeedback, handleFeedNow]);

    return (
      <View style={styles.feederCard}>
        <View style={styles.feederCardHeader}>
          <Text style={styles.feederName}>
            {getFeederDisplayName(item, feeders, false)}
          </Text>
        </View>
        
        <View style={styles.feederCardBody}>
          <View style={styles.feederInfoRow}>
            <Text style={styles.feederInfoLabel}>Serial Number:</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.feederInfoValue}>
                {item.hardwareid ? formatHardwareIdForDisplay(item.hardwareid) : 'Not set'}
              </Text>
            </View>
          </View>
          
          <View style={styles.feederInfoRow}>
            <Text style={styles.feederInfoLabel}>Food Brand:</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.feederInfoValue}>{item.brandname || item.foodbrand || 'Not set'}</Text>
            </View>
          </View>
          
          <View style={styles.feederInfoRow}>
            <Text style={styles.feederInfoLabel}>Cat:</Text>
            <View style={styles.valueContainer}>
              {associatedCat ? (
                <TouchableOpacity onPress={navigateToCatDetails}>
                  <Text style={[styles.feederInfoValue, styles.catLink]}>
                    {associatedCat.catname}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.feederInfoValue}>None Associated</Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.feederCardActions}>
          <Button
            title="Feed Now"
            variant="primary"
            onPress={confirmFeedNow}
            style={[styles.actionButton, styles.feedNowButton]}
          />
          <Button
            title="Configure"
            variant="secondary"
            onPress={navigateToScheduler}
            style={[styles.actionButton]}
          />
        </View>
      </View>
    );
  });
  
  // Make sure we have a display name for debugging purposes
  FeederCard.displayName = 'FeederCard';
  
  // Custom grid layout component - memoized
  const FeederGrid = React.memo(() => {
    return (
      <View style={styles.gridContainer}>
        <View style={[
          styles.gridRow,
          // Center when there are fewer items than would fill a row
          layoutValues.gridRowCenteredCondition && styles.gridRowCentered
        ]}>
          {sortedFeeders.map((item, index) => (
            <View 
              key={item.id.toString()} 
              style={[
                styles.feederCardWrapper,
                layoutValues.useScrolling ? 
                  { width: layoutValues.minCardWidth } : 
                  { width: `${layoutValues.cardWidthPercent * 100}%` }
              ]}
            >
              <FeederCard item={item} index={index} />
            </View>
          ))}
        </View>
      </View>
    );
  });
  
  FeederGrid.displayName = 'FeederGrid';

  // Memoize content section to reduce rerenders
  const Content = useMemo(() => {
    if (loading || fetchingCats) {
      return <LoadingIndicator />;
    }
    
    return (
      <>
        {feeders.length > 0 ? (
          <View style={styles.feedersContainer}>
            <FeederGrid />
          </View>
        ) : (
          <NoFeedersView />
        )}
        
        <View style={styles.actionButtonContainer}>
          <Button 
            title="Create Feeder"
            variant="primary"
            onPress={navigateToCreateFeeder}
            style={styles.createButton}
          />
        </View>
      </>
    );
  }, [loading, fetchingCats, feeders, navigateToCreateFeeder]);

  return (
    <View style={GlobalStyles.container}>
      <ScrollView 
        style={styles.scrollView} 
        horizontal={layoutValues.useScrolling}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={[
          GlobalStyles.responsiveContentContainer, 
          styles.mainContainer,
          { maxWidth: layoutValues.contentWidth },
          layoutValues.useScrolling && { 
            width: feeders.length * layoutValues.minCardWidth * 1.02 
          }
        ]}>
          {/* Header section */}
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={GlobalStyles.backButton} 
                onPress={goBack}
              >
                <Text style={GlobalStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.pageTitle}>Your Feeders</Text>
          
          {/* Main content */}
          {Content}
          
          {/* Add feedback modal for web */}
          {Platform.OS === 'web' && (
            <FeedbackModal
              visible={showFeedbackModal}
              title={modalTitle}
              message={modalMessage}
              type={modalType}
              onDismiss={handleModalDismiss}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
});

// Add display name for debugging purposes
MainPage.displayName = 'MainPage';

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 16,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  feedersContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gridContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 10,
  },
  gridRowCentered: {
    justifyContent: 'center',
  },
  feederCardWrapper: {
    padding: 10,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 280, // Ensure cards maintain a good size on larger screens
    maxWidth: 450, // Prevent cards from becoming too wide on large screens
  },
  feederCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    flexDirection: 'column',
    height: '100%',
  },
  feederCardHeader: {
    padding: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  feederName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  feederCardBody: {
    padding: 20,
    flex: 1,
  },
  feederInfoRow: {
    marginBottom: 10,
  },
  feederInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  feederInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idLabel: {
    marginBottom: 0,
    marginRight: 8,
  },
  valueContainer: {
    marginTop: 2,
  },
  catLink: {
    color: '#006bff',
    textDecorationLine: 'underline',
  },
  feederCardActions: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  actionButton: {
    flex: 0,
    width: '100%',
    minHeight: 44, // iOS minimum touch target size
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedNowButton: {
    backgroundColor: '#007AFF', // iOS blue color
  },
  noFeedersContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 40,
    width: '100%',
    maxWidth: 600,
    marginHorizontal: 'auto',
  },
  noFeedersText: {
    fontSize: 18,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  noFeedersSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  actionButtonContainer: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center' as const, // Center the button
  },
  createButton: {
    minWidth: 200,
    maxWidth: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#FFD700',
    marginTop: 10,
  },
  debuggerContainer: {
    marginTop: 20,
    flex: 1,
    minHeight: 500,
  },
});

export default MainPage;