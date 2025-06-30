import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Alert, 
  Platform, 
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import { useCats, useDisassociateCat } from '../utils/features/cats/hooks';
import FeedbackModal from '../components/FeedbackModal';
import { showFeedback, ModalType } from '../utils/helpers/feedbackHelpers';
import { getFeederDisplayName } from '../utils/helpers/feederHelpers';
import { useFeeders } from '../utils/features/feeders/hooks';

// Define Feeder type for proper typing
interface Feeder {
  id: number;
  name?: string | null;
  brandname?: string | null;
  [key: string]: any;
}

const CatPage = (): JSX.Element => {
  const { cats, loading, refetch } = useCats();
  const { disassociateCat, loading: deleting } = useDisassociateCat();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // Use the existing feeders hook instead of manually fetching
  const { feeders } = useFeeders();
  
  // Add debugging effect
  useEffect(() => {
    // Remove all debugging console.log statements that cause extra renders
  }, [cats]);
  
  // Calculate responsive layout values - memoized to prevent recalculation on every render
  const layoutValues = useMemo(() => {
    // Define breakpoints for different device sizes
    const mobileBreakpoint = 600;
    const tabletBreakpoint = 1024;
    
    // Calculate number of columns based on available width
    const numColumns = width < mobileBreakpoint ? 1 : width < tabletBreakpoint ? 2 : 3;
    
    // Set min card width to maintain ideal proportions
    const minCardWidth = 280; // Minimum width in pixels for a good looking card
    
    // Calculate actual card width based on available space
    // For mobile, use full width with padding
    // For tablet/desktop, divide available space by columns
    const cardWidthPercent = numColumns === 1 ? 1 : 
                           numColumns === 2 ? 0.48 : 
                           0.31; // Convert percentages to numbers
    
    // For very small screens, maintain minimum width and allow horizontal scrolling
    const useScrolling = width < 360; // iOS smallest width ~320px
    
    return { 
      numColumns, 
      cardWidthPercent, 
      useScrolling, 
      minCardWidth,
      // Add this additional field to prevent re-calculation
      gridRowCenteredCondition: (cats?.length || 0) < numColumns
    };
  }, [width, cats?.length]);
  
  // Modal state (for web only)
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>(ModalType.SUCCESS);
  
  // Helper function to show feedback - memoized
  const handleShowFeedback = useCallback((title: string, message: string, type: ModalType) => {
    showFeedback(
      title, 
      message, 
      type, 
      setShowModal, 
      setModalTitle, 
      setModalMessage, 
      setModalType
    );
  }, []);
  
  // Add goBack function - memoized
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  // Navigate to create cat page - memoized
  const navigateToCreateCat = useCallback(() => {
    router.push('/screens/CreateCatPage');
  }, [router]);

  // Navigate to cat details - memoized
  const navigateToCatDetails = useCallback((catId: number) => {
    router.push({
      pathname: '/screens/CatDetailsPage/[catid]',
      params: { catid: catId.toString() },
    });
  }, [router]);

  // Navigate to edit cat - memoized
  const navigateToEditCat = useCallback((catId: number) => {
    router.push({
      pathname: '/screens/EditCatPage/[catid]',
      params: { catid: catId.toString() },
    });
  }, [router]);

  // Modal dismiss callback - memoized
  const modalDismiss = useCallback(() => setShowModal(false), []);

  // Render a single cat card
  const CatCard = React.memo(({ item }: { item: any }) => {
    // Use memoized callbacks to prevent unnecessary re-renders
    const handleViewDetails = useCallback(() => navigateToCatDetails(item.catid), [item.catid]);
    const handleEditCat = useCallback(() => navigateToEditCat(item.catid), [item.catid]);
    
    // Memoize style objects to avoid recreation on each render
    const cardHeaderStyle = styles.catCardHeader;
    const cardBodyStyle = styles.catCardBody;
    const cardActionsStyle = styles.catCardActions;
    const actionButtonStyle = styles.actionButton;
    
    // Find the associated feeder to get its name
    const feeder = item.feederid ? feeders.find(f => f.id === item.feederid) : null;
    
    return (
      <View style={styles.catCard}>
        <View style={cardHeaderStyle}>
          <Text style={styles.catName}>{item.catname}</Text>
        </View>
        
        <View style={cardBodyStyle}>
          <View style={styles.catInfoRow}>
            <Text style={styles.catInfoLabel}>Feeder:</Text>
            <Text style={styles.catInfoValue}>
              {item.feederid 
                ? (feeder ? getFeederDisplayName(feeder, feeders, false) : 'Unknown Feeder')
                : 'Not Assigned'}
            </Text>
          </View>
          
          <View style={styles.catInfoRow}>
            <Text style={styles.catInfoLabel}>Microchip:</Text>
            <Text style={styles.catInfoValue}>
              {item.microchip ? (
                <Text style={styles.microchipText}>{item.microchip}</Text>
              ) : (
                <Text style={styles.noMicrochipText}>Not Registered</Text>
              )}
            </Text>
          </View>
          
          <View style={styles.catInfoRow}>
            <Text style={styles.catInfoLabel}>Weight:</Text>
            <Text style={styles.catInfoValue}>{item.catweight ? `${item.catweight} lbs` : 'Unknown'}</Text>
          </View>
          
          {item.catbreed && (
            <View style={styles.catInfoRow}>
              <Text style={styles.catInfoLabel}>Breed:</Text>
              <Text style={styles.catInfoValue}>{item.catbreed}</Text>
            </View>
          )}
        </View>
        
        <View style={cardActionsStyle}>
          <Button
            title="View Details"
            variant="primary"
            onPress={handleViewDetails}
            style={actionButtonStyle}
          />
          
          <Button
            title="Edit"
            variant="secondary"
            onPress={handleEditCat}
            style={actionButtonStyle}
          />
        </View>
      </View>
    );
  });
  
  // Add display name for React DevTools
  CatCard.displayName = 'CatCard';

  // Extract NoCatsView for better component organization
  const NoCatsView = React.memo(() => (
    <View style={styles.noCatsContainer}>
      <Text style={styles.noCatsText}>
        You don't have any cats yet.
      </Text>
      <Text style={styles.noCatsSubtext}>
        Add your first cat to get started!
      </Text>
    </View>
  ));

  NoCatsView.displayName = 'NoCatsView';

  return (
    <View style={GlobalStyles.container}>
      <ScrollView style={styles.scrollView} horizontal={layoutValues.useScrolling}>
        <View style={[
          styles.mainContainer,
          layoutValues.useScrolling && { width: cats?.length * layoutValues.minCardWidth }
        ]}>
          <View style={styles.headerContainer}>
            {/* Add back button */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={GlobalStyles.backButton} 
                onPress={goBack}
              >
                <Text style={GlobalStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[GlobalStyles.title, styles.title]}>Your Cats</Text>
          
          {loading ? (
            <LoadingIndicator />
          ) : (
            <>
              {cats && cats.length > 0 ? (
                <View style={styles.gridContainer}>
                  <View style={[
                    styles.gridRow,
                    // Center when there are fewer items than would fill a row
                    layoutValues.gridRowCenteredCondition && styles.gridRowCentered
                  ]}>
                    {cats.map((cat) => (
                      <View 
                        key={cat.catid.toString()} 
                        style={[
                          styles.catCardWrapper,
                          { width: `${layoutValues.cardWidthPercent * 100}%` }
                        ]}
                      >
                        <CatCard item={cat} />
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <NoCatsView />
              )}
              
              <View style={styles.actionButtonContainer}>
                <Button 
                  title="Add a New Cat"
                  variant="primary"
                  onPress={navigateToCreateCat}
                  style={styles.createButton}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Feedback Modal (for web only) */}
      <FeedbackModal
        visible={showModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onDismiss={modalDismiss}
      />
    </View>
  );
};

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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  gridContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  catCardWrapper: {
    padding: 10,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 280, // Ensure cards maintain a good size on larger screens
    maxWidth: 450, // Prevent cards from becoming too wide on large screens
  },
  catCard: {
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
    minHeight: 300, // Ensure consistent height for cat cards
  },
  catCardHeader: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  catCardBody: {
    padding: 15,
    flex: 1, // Allow body to expand and fill available space
  },
  catCardActions: {
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
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  noCatsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginVertical: 20,
  },
  noCatsText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  noCatsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButtonContainer: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    minWidth: 200,
    maxWidth: 300,
  },
  catName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  catInfoRow: {
    marginBottom: 10,
  },
  catInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  catInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  microchipText: {
    color: '#2E7D32', // A nice green color for valid microchip numbers
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace font for numbers
  },
  noMicrochipText: {
    color: '#757575', // A subtle gray for missing microchip
    fontStyle: 'italic',
  },
  picker: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default React.memo(CatPage);