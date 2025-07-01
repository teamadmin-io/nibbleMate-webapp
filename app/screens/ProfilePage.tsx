import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import FeedbackModal from '../components/FeedbackModal';
import { showFeedback, ModalType } from '../utils/helpers/feedbackHelpers';
import { useRouter } from 'expo-router';
import { 
  useSignOutSelector,
  useProfileSelector, 
  useProfileEditorSelector
} from '../utils/features/demo/hookSelector';
import { 
  useFeedersSelector, 
  useAvailableFeedersSelector, 
  useAssignHardwareIdSelector,
  useDeleteFeederSelector,
  useUnassignCatsFromFeederSelector
} from '../utils/features/demo/hookSelector';
import { useForm } from '../utils/helpers/forms';
import { 
  formatHardwareIdForDisplay, 
  validateHardwareId,
  getFeederDisplayName
} from '../utils/helpers/feederHelpers';
import { useFetchAllCatsSelector } from '../utils/features/demo/hookSelector';
import { useDemo } from '../utils/contexts/DemoProvider';

// Define Cat type
interface Cat {
  catid: number;
  catname: string;
  catweight?: number | null;
  feederid: number | null;
}

// ConfirmationModal component for handling confirmation dialogs
interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: ModalType;
  feederInfo: { id: number; name: string };
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = ModalType.WARNING,
  feederInfo
}) => {
  const { width } = useWindowDimensions();

  // Get modal styles based on type
  const getHeaderStyle = () => {
    switch (type) {
      case ModalType.ERROR:
        return { backgroundColor: '#FFE1E1', borderColor: '#FF5252', borderWidth: 1 };
      case ModalType.WARNING:
        return { backgroundColor: '#FFF8E1', borderColor: '#FFC107', borderWidth: 1 };
      case ModalType.INFO:
        return { backgroundColor: '#E3F2FD', borderColor: '#2196F3', borderWidth: 1 };
      case ModalType.SUCCESS:
      default:
        return { backgroundColor: '#E8F5E9', borderColor: '#4CAF50', borderWidth: 1 };
    }
  };
  
  const getTitleStyle = () => {
    switch (type) {
      case ModalType.ERROR:
        return { color: '#D32F2F' };
      case ModalType.WARNING:
        return { color: '#F57F17' };
      case ModalType.INFO:
        return { color: '#1976D2' };
      case ModalType.SUCCESS:
      default:
        return { color: '#2E7D32' };
    }
  };
  
  const getButtonStyle = (isConfirm: boolean) => {
    if (isConfirm) {
      return type === ModalType.ERROR ? 'danger' : 'primary';
    }
    return 'danger'; // Changed from 'secondary' to 'danger' for red cancel buttons
  };

  // Import CrossPlatformModal
  const CrossPlatformModal = require('../components/CrossPlatformModal').default;

  // Get appropriate button layout based on screen width
  const isNarrowScreen = width < 450;

  return (
    <CrossPlatformModal
      visible={visible}
      onClose={onCancel}
      showCloseButton={false}
      avoidKeyboard={false}
    >
      <View style={{ 
        overflow: 'hidden', 
        width: '100%',
        maxWidth: isNarrowScreen ? '95%' : '100%',
        maxHeight: isNarrowScreen ? '95%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <View style={[
          { 
            padding: isNarrowScreen ? 8 : 12,
            marginBottom: isNarrowScreen ? 8 : 15, 
            borderRadius: 4,
            marginLeft: -10,
            marginRight: -10,
            marginTop: -10,
          },
          getHeaderStyle()
        ]}>
          <Text style={[
            { 
              fontSize: isNarrowScreen ? 16 : width < 600 ? 18 : 20, 
              fontWeight: 'bold',
              paddingRight: 5 // Prevent text from getting cut off
            },
            getTitleStyle()
          ]}>
            {title}
          </Text>
        </View>
        
        <Text style={{ 
          marginBottom: isNarrowScreen ? 10 : 25,
          fontSize: isNarrowScreen ? 14 : width < 600 ? 15 : 16,
          lineHeight: isNarrowScreen ? 18 : 24,
          color: '#333',
        }}>
          {message}
        </Text>
        
        <View style={{ 
          flexDirection: isNarrowScreen ? 'column' : 'row',
          justifyContent: 'space-between',
          marginTop: 8,
          marginBottom: 6,
        }}>
          <Button 
            title={cancelText}
            variant={getButtonStyle(false)}
            onPress={onCancel}
            style={{ 
              flex: isNarrowScreen ? 0 : 1,
              marginRight: isNarrowScreen ? 0 : 8,
              marginBottom: isNarrowScreen ? 8 : 0,
              minHeight: isNarrowScreen ? 36 : 44,
              paddingVertical: isNarrowScreen ? 6 : undefined,
              height: isNarrowScreen ? 36 : undefined
            }}
          />
          <Button 
            title={confirmText}
            variant={getButtonStyle(true)}
            onPress={onConfirm}
            style={{ 
              flex: isNarrowScreen ? 0 : 1,
              marginLeft: isNarrowScreen ? 0 : 8,
              minHeight: isNarrowScreen ? 36 : 44,
              paddingVertical: isNarrowScreen ? 6 : undefined,
              height: isNarrowScreen ? 36 : undefined
            }}
          />
        </View>
      </View>
    </CrossPlatformModal>
  );
};

// Extracted FeederCard component to prevent hooks in loops error
const FeederCard = React.memo(({ 
  feeder, 
  index, 
  router, 
  findCatByFeederId, 
  loadingCats, 
  handleDeleteFeeder, 
  deleting,
  layoutValues,
  feeders,
  styles
}: {
  feeder: any;
  index: number;
  router: any;
  findCatByFeederId: (id: number) => any;
  loadingCats: boolean;
  handleDeleteFeeder: (id: number, name: string) => void;
  deleting: boolean;
  layoutValues: any;
  feeders: any[];
  styles: any;
}) => {
  // Use memoized callbacks to prevent unnecessary re-renders
  const navigateToScheduler = useCallback(() => {
    router.push({
      pathname: '/screens/Scheduler',
      params: { 
        feederId: feeder.id,
        feederName: feeder.name || `Feeder ${index + 1}` 
      }
    });
  }, [feeder.id, feeder.name, index, router]);
  
  const handleDeleteFeederClick = useCallback(() => {
    handleDeleteFeeder(
      feeder.id, 
      feeder.name || `Feeder ${index + 1}`
    );
  }, [feeder.id, feeder.name, index, handleDeleteFeeder]);
  
  const navigateToCatDetails = useCallback(() => {
    const associatedCat = findCatByFeederId(feeder.id);
    if (associatedCat) {
      router.push({
        pathname: '/screens/CatDetailsPage/[catid]',
        params: { catid: associatedCat.catid }
      });
    }
  }, [feeder.id, findCatByFeederId, router]);
  
  return (
    <View 
      style={styles.feederCard}
    >
      <View style={styles.feederHeader}>
        <Text style={styles.feederTitle}>
          {getFeederDisplayName(feeder, feeders, false)}
        </Text>
        <Text style={styles.feederSubtitle}>ID: {feeder.id}</Text>
      </View>
      
      <View style={styles.feederBody}>
        <View style={styles.feederInfoRow}>
          <Text style={styles.feederLabel}>Serial Number:</Text>
          <Text style={styles.feederValue}>
            {feeder.hardwareid ? formatHardwareIdForDisplay(feeder.hardwareid) : 'Not set'}
          </Text>
        </View>
        
        <View style={styles.feederInfoRow}>
          <Text style={styles.feederLabel}>Food Brand:</Text>
          <Text style={styles.feederValue}>
            {feeder.foodbrand || feeder.brandname || 'Not set'}
          </Text>
        </View>
        
        {/* Display associated cat information */}
        <View style={styles.feederInfoRow}>
          <Text style={styles.feederLabel}>Associated Cat:</Text>
          {loadingCats ? (
            <Text style={styles.feederValue}>Loading cat data...</Text>
          ) : (
            <View style={styles.catInfoContainer}>
              {findCatByFeederId(feeder.id) ? (
                <TouchableOpacity
                  onPress={navigateToCatDetails}
                >
                  <Text style={styles.catNameLink}>
                    {findCatByFeederId(feeder.id)?.catname}
                    {findCatByFeederId(feeder.id)?.catweight ? 
                      ` (${findCatByFeederId(feeder.id)?.catweight} lbs)` : ''}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.feederValue}>None Associated</Text>
              )}
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.feederActions}>
        <TouchableOpacity 
          style={styles.configureButton}
          onPress={navigateToScheduler}
        >
          <Text style={styles.configureButtonText}>Configure</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteFeederClick}
          disabled={deleting}
        >
          <Text style={styles.deleteButtonText}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Add display name for React DevTools
FeederCard.displayName = 'FeederCard';

// Create type definitions for our memoized components
interface ProfileEditFormProps {
  editedUsername: string;
  setEditedUsername: React.Dispatch<React.SetStateAction<string>>;
  profile: any;
  saveUsername: () => Promise<void>;
  cancelEditing: () => void;
  loadingProfile: boolean;
  styles: any;
}

interface ProfileViewFormProps {
  profile: any;
  startEditing: (username: string) => void;
  styles: any;
}

interface FeederLinkSectionProps {
  feederForm: {
    selectedFeederId: string;
    hardwareId: string;
  };
  updateFeederField: <K extends "selectedFeederId" | "hardwareId">(field: K, value: string) => void;
  availableFeeders: any[];
  showIOSPicker: boolean;
  setShowIOSPicker: React.Dispatch<React.SetStateAction<boolean>>;
  handleLinkFeeder: () => Promise<void>;
  assigning: boolean;
  styles: any;
}

function ProfilePageComponent(): JSX.Element {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const styles = getStyles(width);
  const { signOut, loading: signingOut } = useSignOutSelector();
  const { profile, loading: loadingProfile, updateUsername } = useProfileSelector();
  const { feeders, loading: loadingFeeders, refetch: refetchFeeders } = useFeedersSelector();
  const { 
    availableFeeders, 
    loading: loadingAvailableFeeders, 
    refetch: refetchAvailableFeeders 
  } = useAvailableFeedersSelector();
  const { assign, loading: assigning } = useAssignHardwareIdSelector();
  const { deleteFeeder, loading: deleting } = useDeleteFeederSelector();
  const { unassignCats, loading: unassigningCats } = useUnassignCatsFromFeederSelector();
  const { isDemoMode } = useDemo();
  const { fetchAllCats } = useFetchAllCatsSelector();
  
  // State for cats data
  const [cats, setCats] = useState<Cat[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  
  // Calculate responsive layout values - memoized to prevent recalculation on every render
  const layoutValues = useMemo(() => {
    // Define breakpoints to match MainPage.tsx
    const mobileBreakpoint = 600;
    const tabletBreakpoint = 1024;
    const desktopBreakpoint = 1440;
    
    // Default values
    let containerWidthPercent = 1; // 100%
    let containerWidthValue = width;
    let cardColumns = 1;
    let horizontalPadding = 16;
    const isMobile = width < mobileBreakpoint;
    
    // Adjust based on screen size
    if (isMobile) {
      containerWidthPercent = 1; // 100% width
      cardColumns = 1;
      horizontalPadding = 8; // Small padding for mobile web
    } else if (width < tabletBreakpoint) {
      // Tablet: 90% of screen width - STRICTLY 2 columns
      containerWidthPercent = 0.9;
      cardColumns = 2;
      horizontalPadding = 24;
    } else {
      // Desktop: 80% of screen width - STRICTLY 3 columns max
      containerWidthPercent = 0.8;
      cardColumns = 3; // Cap at 3 columns maximum
      horizontalPadding = 32;
    }
    
    // Calculate container width value (in pixels)
    containerWidthValue = Math.min(width * containerWidthPercent, 1400);
    
    // For very small screens, maintain minimum width and allow horizontal scrolling
    const useScrolling = width < 360; // iOS smallest width ~320px
    
    return { 
      containerWidthValue,
      containerWidthPercent,
      cardColumns, 
      useScrolling,
      horizontalPadding,
      isMobile
    };
  }, [width, feeders?.length]);
  
  // Fetch cats - memoized to prevent unnecessary re-renders
  const fetchCats = useCallback(async () => {
    try {
      setLoadingCats(true);
      const catsData = await fetchAllCats();
      if (catsData && Array.isArray(catsData)) {
        setCats(catsData);
      }
    } catch (error) {
      console.error('Error fetching cats data:', error);
      setCats([]);
    } finally {
      setLoadingCats(false);
    }
  }, []);
  
  // Helper function to find a cat by feeder ID - memoized
  const findCatByFeederId = useCallback((feederId: number): Cat | null => {
    return cats.find(cat => cat.feederid === feederId) || null;
  }, [cats]);
  
  useEffect(() => {
    if (!loadingFeeders && feeders.length > 0) {
      // Simplified logging to reduce render triggers
      console.log('🔍 DEBUG - ProfilePage feeders loaded:', feeders.length);
      fetchCats();
    }
  }, [loadingFeeders, feeders, fetchCats]);
  
  // Modal state (for web only)
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>(ModalType.SUCCESS);
  
  // Added state for the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    confirmAction: () => {},
    feederInfo: { id: 0, name: '' }
  });
  
  // Add this to the state declarations at the top of the ProfilePage component
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  
  // Helper function to show feedback with platform-specific handling - memoized
  const handleShowFeedback = useCallback((title: string, message: string, type: ModalType) => {
    // Use native alert for iOS/Android
    if (Platform.OS !== 'web') {
      // For ERROR type, show destructive style
      if (type === ModalType.ERROR) {
        Alert.alert(title, message, [{ text: 'OK' }]);
      } 
      // For SUCCESS type, show with OK button
      else if (type === ModalType.SUCCESS) {
        Alert.alert(title, message, [{ text: 'OK' }]);
      }
      // For other types (INFO, WARNING)
      else {
        Alert.alert(title, message, [{ text: 'OK' }]);
      }
    } else {
      // Use modal feedback for web
      showFeedback(
        title, 
        message, 
        type, 
        setShowModal, 
        setModalTitle, 
        setModalMessage, 
        setModalType
      );
    }
  }, []);
  
  // Use the profile editor hook for edit state management
  const { 
    isEditing, 
    editedUsername, 
    setEditedUsername, 
    startEditing, 
    cancelEditing 
  } = useProfileEditorSelector();
  
  // Use the form hook for feeder form inputs
  const { formData: feederForm, updateField: updateFeederField, resetForm: resetFeederForm } = useForm({
    selectedFeederId: '',
    hardwareId: ''
  });

  // Save the updated username - memoized
  const saveUsername = useCallback(async () => {
    const success = await updateUsername(editedUsername);
    if (success) {
      cancelEditing();
      handleShowFeedback(
        'Success!', 
        'Username updated successfully.', 
        ModalType.SUCCESS
      );
    }
  }, [updateUsername, editedUsername, cancelEditing, handleShowFeedback]);

  // Link a feeder - memoized
  const handleLinkFeeder = useCallback(async () => {
    try {
      // Validation step 1: Check if a feeder is selected
      if (!feederForm.selectedFeederId.trim()) {
        handleShowFeedback(
          'Feeder Required', 
          'Please select a feeder from the dropdown menu.', 
          ModalType.ERROR
        );
        return;
      }

      // Validation step 2: Check if hardware ID is valid
      const formattedHardwareId = validateHardwareId(feederForm.hardwareId);
      if (!formattedHardwareId) {
        handleShowFeedback(
          'Invalid Serial Number', 
          'Please enter a valid 12-character hex value (e.g., AA:BB:CC:DD:EE:FF or AABBCCDDEEFF).', 
          ModalType.ERROR
        );
        return;
      }
      
      // Validation step 3: Check if feeder ID is valid
      const feederId = parseInt(feederForm.selectedFeederId.trim(), 10);
      if (isNaN(feederId)) {
        handleShowFeedback(
          'Invalid Feeder', 
          'The selected feeder is invalid. Please try selecting a different feeder.', 
          ModalType.ERROR
        );
        return;
      }
      
      // Get feeder name for better feedback
      const selectedFeeder = availableFeeders.find(f => f.id === feederId);
      const feederName = selectedFeeder ? 
        (selectedFeeder.name || `Feeder #${feederId}`) : 
        `Feeder #${feederId}`;
      
      // Attempt to assign hardware ID
      const success = await assign(feederId, formattedHardwareId);
      
      if (success) {
        // Reset the form
        resetFeederForm();
        
        // Refresh both feeder lists to update UI
        await refetchFeeders();
        await refetchAvailableFeeders();
        
        // Show success feedback with feeder name for context
        handleShowFeedback(
          'Success!', 
          `Serial number successfully assigned to ${feederName}.`, 
          ModalType.SUCCESS
        );
      }
    } catch (error: any) {
      // Handle errors that might occur during the process
      console.error('Error linking feeder:', error);
      
      // Provide user-friendly error message
      handleShowFeedback(
        'Error Linking Feeder', 
        error.message || 'An unexpected error occurred. Please try again.', 
        ModalType.ERROR
      );
    }
  }, [feederForm, handleShowFeedback, assign, resetFeederForm, refetchFeeders, refetchAvailableFeeders, availableFeeders]);

  // Handle feeder deletion
  const handleDeleteFeeder = useCallback(async (feederId: number, feederName: string) => {
    const promptDeleteFeeder = async () => {
      // Check if feeder exists in the cats table
      const feederHasCat = findCatByFeederId(feederId) !== null;
      
      if (feederHasCat) {
        // If feeder has an associated cat, prompt the user to confirm
                  if (Platform.OS === 'web') {
            setConfirmModalConfig({
              title: "Warning: Associated Cat",
              message: `This feeder is associated with a cat. The cat will remain in your account but will be unlinked from this feeder. Do you want to continue?`,
              confirmAction: () => handleUnassignAndDeleteFeeder(feederId, feederName),
              feederInfo: { id: feederId, name: feederName }
            });
            setShowConfirmModal(true);
          } else {
            Alert.alert(
              "Warning: Associated Cat",
              `This feeder is associated with a cat. The cat will remain in your account but will be unlinked from this feeder. Do you want to continue?`,
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Unlink & Delete", 
                  onPress: () => handleUnassignAndDeleteFeeder(feederId, feederName),
                  style: "destructive" 
                }
              ]
            );
        }
      } else {
        // If no cat is associated, continue with normal deletion
        if (Platform.OS === 'web') {
          setConfirmModalConfig({
            title: "Confirm Deletion",
            message: `Are you sure you want to delete ${feederName}?`,
            confirmAction: async () => {
              try {
                const success = await deleteFeeder(feederId);
                if (success) {
                  // Refresh feeders list
                  refetchFeeders();
                  // Refresh cats data
                  fetchCats();
                  
                  handleShowFeedback(
                    "Success",
                    `${feederName} has been deleted successfully.`,
                    ModalType.SUCCESS
                  );
                }
              } catch (error: any) {
                handleShowFeedback(
                  "Error",
                  error.message || "Failed to delete feeder",
                  ModalType.ERROR
                );
              }
            },
            feederInfo: { id: feederId, name: feederName }
          });
          setShowConfirmModal(true);
        } else {
          Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete ${feederName}?`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Delete", 
                onPress: async () => {
                  try {
                    const success = await deleteFeeder(feederId);
                    if (success) {
                      // Refresh feeders list
                      refetchFeeders();
                      // Refresh cats data
                      fetchCats();
                    }
                  } catch (error) {
                    console.error("Failed to delete feeder", error);
                  }
                },
                style: "destructive" 
              }
            ]
          );
        }
      }
    };
    
    promptDeleteFeeder();
  }, [deleteFeeder, findCatByFeederId, fetchCats, refetchFeeders, handleShowFeedback]);
  
  // Handle unlinking cats and then deleting the feeder - memoized
  const handleUnassignAndDeleteFeeder = useCallback(async (feederId: number, feederName: string) => {
    try {
      // First unassign any cats
      await unassignCats(feederId);
      
      // Then delete the feeder
      const success = await deleteFeeder(feederId);
      
      // Update UI
      if (success) {
        // Refresh feeders
        await refetchFeeders();
        
        // Refresh cats data to update UI
        await fetchCats();
        
        // Show success message
        handleShowFeedback(
          'Success!', 
          `Feeder "${feederName}" has been deleted.`, 
          ModalType.SUCCESS
        );
      }
    } catch (error: any) {
      // Handle errors
      handleShowFeedback(
        'Error', 
        `Failed to delete feeder: ${error.message}`, 
        ModalType.ERROR
      );
    }
  }, [unassignCats, deleteFeeder, refetchFeeders, fetchCats, handleShowFeedback]);

  // Add the goBack function - memoized
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  // Check if loading
  const loading = loadingProfile || loadingFeeders || loadingAvailableFeeders;

  // Memoize content section to reduce rerenders
  const Content = useMemo(() => {
    const localStyles = getStyles(width);
    if (loading) {
      return (
        <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
          <LoadingIndicator />
        </View>
      );
    }
    if (isDemoMode) {
      return (
        <View style={[GlobalStyles.container, { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }]}> 
          <View style={{ padding: 32, borderRadius: 16, backgroundColor: '#f6f6f6', alignItems: 'center', minWidth: 320 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>DEMO USER</Text>
            <Text style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>This is a demo profile.</Text>
            <Text style={{ fontSize: 14, color: '#aaa', marginBottom: 16 }}>No real credentials are shown in demo mode.</Text>
          </View>
        </View>
      );
    }
    return (
      <ScrollView
        style={localStyles.scrollView}
        contentContainerStyle={[
          localStyles.scrollViewContent,
          { paddingBottom: 50 }
        ]}
        showsVerticalScrollIndicator={true}
      >
        <View style={localStyles.mainContainer}>
          <View style={localStyles.headerContainer}>
            <View style={localStyles.header}>
              <TouchableOpacity
                style={GlobalStyles.backButton}
                onPress={goBack}
              >
                <Text style={GlobalStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[
            GlobalStyles.contentContainer,
            localStyles.centeredContent,
            {
              width: `${layoutValues.containerWidthPercent * 100}%`,
              maxWidth: layoutValues.containerWidthValue,
              paddingHorizontal: layoutValues.horizontalPadding,
              paddingLeft: Platform.OS === 'web' && width < 600 ? layoutValues.horizontalPadding : undefined,
              paddingRight: Platform.OS === 'web' && width < 600 ? layoutValues.horizontalPadding : undefined
            }
          ]}>
            <View style={localStyles.section}>
              <Text style={localStyles.sectionTitle}>Profile</Text>
              <View style={localStyles.card}>
                {isEditing ? (
                  <ProfileEditForm
                    editedUsername={editedUsername}
                    setEditedUsername={setEditedUsername}
                    profile={profile}
                    saveUsername={saveUsername}
                    cancelEditing={cancelEditing}
                    loadingProfile={loadingProfile}
                    styles={localStyles}
                  />
                ) : (
                  <ProfileViewForm
                    profile={profile}
                    startEditing={startEditing}
                    styles={localStyles}
                  />
                )}
              </View>
            </View>
            <FeederLinkSection
              feederForm={feederForm}
              updateFeederField={updateFeederField}
              availableFeeders={availableFeeders}
              showIOSPicker={showIOSPicker}
              setShowIOSPicker={setShowIOSPicker}
              handleLinkFeeder={handleLinkFeeder}
              assigning={assigning}
              styles={localStyles}
            />
            {feeders.length > 0 && (
              <View style={localStyles.section}>
                <Text style={localStyles.sectionTitle}>Your Feeders</Text>
                <View style={[localStyles.card, { display: 'flex', alignItems: 'center' }]}> 
                  <View style={localStyles.feedersGrid}>
                    {feeders.map((feeder, index) => (
                      <View
                        key={feeder.id.toString()}
                        style={[
                          localStyles.feederCardWrapper,
                          layoutValues.useScrolling ?
                            { width: 280 } :
                            { width: `${(100 / layoutValues.cardColumns) - 2}%` }
                        ]}
                      >
                        <FeederCard
                          key={feeder.id}
                          feeder={feeder}
                          index={index}
                          router={router}
                          findCatByFeederId={findCatByFeederId}
                          loadingCats={loadingCats}
                          handleDeleteFeeder={handleDeleteFeeder}
                          deleting={deleting}
                          layoutValues={layoutValues}
                          feeders={feeders}
                          styles={localStyles}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
            <View style={localStyles.signOutSection}>
              <Button
                title="Sign Out"
                variant="danger"
                onPress={signOut}
                isLoading={signingOut}
                style={localStyles.signOutButton}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }, [
    loading, layoutValues, goBack, isEditing, editedUsername, setEditedUsername,
    profile, saveUsername, cancelEditing, loadingProfile, startEditing, feederForm,
    updateFeederField, availableFeeders, showIOSPicker, setShowIOSPicker,
    handleLinkFeeder, assigning, feeders, router, findCatByFeederId, loadingCats,
    handleDeleteFeeder, deleting, signOut, signingOut, width, isDemoMode
  ]);

  // Add modal dismissal callbacks
  const handleFeedbackDismiss = useCallback(() => {
    setShowModal(false);
  }, []);
  
  const handleConfirmDismiss = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  return (
    <View style={GlobalStyles.container}>
      {/* Feedback Modal (for web only) */}
      <FeedbackModal
        visible={showModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onDismiss={handleFeedbackDismiss}
      />
      
      {/* Confirmation Modal for web */}
      <ConfirmationModal
        visible={showConfirmModal}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={() => {
          setShowConfirmModal(false);
          confirmModalConfig.confirmAction();
        }}
        onCancel={handleConfirmDismiss}
        type={ModalType.WARNING}
        feederInfo={confirmModalConfig.feederInfo}
      />
      
      {Content}
    </View>
  );
}

const getStyles = (width: number) => StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 0, // Remove extra top space to match CatPage
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0, // Remove extra top space
    paddingBottom: 30,
    paddingHorizontal: Platform.OS === 'web' && width < 600 ? 8 : 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' && width < 600 ? '100%' : 1200,
    alignSelf: 'center',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0, // Remove extra space
    paddingTop: 0,   // Remove extra space
  },
  header: {
    width: '100%',
    marginBottom: 0, // Remove extra space
    alignItems: 'flex-start',
    paddingTop: 0,   // Remove extra space
  },
  centeredContent: {
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: Platform.OS === 'web' && width < 600 ? 8 : 0, // Small padding for mobile web
    width: '100%',
    maxWidth: Platform.OS === 'web' && width < 600 ? '100%' : 1200, // Full width for mobile web
  },
  section: {
    marginBottom: 30,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: Platform.OS === 'web' && width < 600 ? 12 : 16, // Slightly more padding for card content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    width: '100%', // Full width
    maxWidth: Platform.OS === 'web' && width < 600 ? '100%' : undefined, // Full width for mobile web
    minWidth: 0,
    overflow: 'hidden',
  },
  formRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#fff',
  },
  picker: {
    ...(Platform.OS === 'ios' ? {
      height: 48,
      width: '100%',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
    } : {
      height: 50,
      width: '100%',
      backgroundColor: 'transparent',
    }),
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: width < 500 ? 'column' : 'row',
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  buttonRowItem: {
    minWidth: 120,
    marginHorizontal: width < 500 ? 0 : 6,
    marginBottom: width < 500 ? 10 : 0,
    width: width < 500 ? '100%' : undefined,
  },
  button: {
    marginTop: 8,
  },
  centeredButton: {
    alignSelf: 'center',
    minWidth: 150,
  },
  // Keep styles consistent with MainPage.tsx
  feedersGrid: {
    flexDirection: Platform.OS === 'web' && width < 600 ? 'column' : 'row',
    flexWrap: Platform.OS === 'web' && width < 600 ? 'nowrap' : 'wrap',
    width: '100%',
    justifyContent: 'flex-start',
    marginHorizontal: Platform.OS === 'web' && width < 600 ? 0 : -10,
    alignSelf: 'center',
    maxWidth: 1400,
  },
  gridRowCentered: {
    justifyContent: 'center',
  },
  feederCardWrapper: {
    padding: Platform.OS === 'web' && width < 600 ? 4 : 10,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: Platform.OS === 'web' && width < 600 ? '100%' : 280,
    maxWidth: Platform.OS === 'web' && width < 600 ? '100%' : 450,
  },
  feederCard: {
    margin: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 200,
    flex: 1,
  },
  feederHeader: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feederTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  feederSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  feederBody: {
    padding: 10,
  },
  feederInfoRow: {
    marginBottom: 8,
  },
  feederLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  feederValue: {
    fontSize: 14,
    color: '#333',
  },
  feederActions: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1, 
    borderTopColor: '#eee',
    justifyContent: 'space-between',
  },
  configureButton: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 4,
    maxWidth: Platform.OS === 'web' && width < 600 ? '48%' : undefined,
  },
  configureButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginLeft: 4,
    maxWidth: Platform.OS === 'web' && width < 600 ? '48%' : undefined,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  signOutSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    width: '100%',
  },
  signOutButton: {
    minWidth: 120,
    maxWidth: 250,
    alignSelf: 'center',
  },
  catInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catNameLink: {
    color: '#007bff',
    textDecorationLine: 'underline',
    fontSize: 14,
    fontWeight: '500',
  },
  iosPickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10000, // Increased z-index for web
  },
  iosPickerHeader: {
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#dedede',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iosPickerDoneBtn: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  iosPickerContent: {
    backgroundColor: '#fff',
    height: 215,
  },
});

// Create a ProfileEditForm component to reduce rerenders
const ProfileEditForm = React.memo(({ 
  editedUsername, 
  setEditedUsername, 
  profile, 
  saveUsername, 
  cancelEditing, 
  loadingProfile, 
  styles
}: ProfileEditFormProps) => {
  return (
    <>
      <View style={styles.formRow}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={editedUsername}
          onChangeText={setEditedUsername}
          placeholder="Enter username"
        />
      </View>
      
      <View style={styles.formRow}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Button 
          title="Save Changes"
          variant="primary"
          onPress={saveUsername}
          isLoading={loadingProfile}
          disabled={loadingProfile}
          style={[styles.button, styles.buttonRowItem]}
        />
        <Button 
          title="Cancel"
          variant="danger"
          onPress={cancelEditing}
          style={[styles.button, styles.buttonRowItem]}
        />
      </View>
    </>
  );
});

ProfileEditForm.displayName = 'ProfileEditForm';

// Create a ProfileViewForm component to reduce rerenders
const ProfileViewForm = React.memo(({ 
  profile, 
  startEditing, 
  styles
}: ProfileViewFormProps) => (
  <>
    <View style={styles.formRow}>
      <Text style={styles.label}>Username</Text>
      <Text style={styles.value}>{profile?.username || 'Not set'}</Text>
    </View>

    <View style={styles.formRow}>
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{profile?.email}</Text>
    </View>

    <Button 
      title="Edit Profile"
      variant="primary"
      onPress={() => startEditing(profile?.username || '')}
      style={[styles.button, styles.centeredButton]}
    />
  </>
));

ProfileViewForm.displayName = 'ProfileViewForm';

// Create a FeederLinkSection component to reduce rerenders
const FeederLinkSection = React.memo(({ 
  feederForm, 
  updateFeederField, 
  availableFeeders, 
  showIOSPicker, 
  setShowIOSPicker, 
  handleLinkFeeder, 
  assigning, 
  styles
}: FeederLinkSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Link a Feeder</Text>
    <Text style={styles.sectionDescription}>Select a feeder and enter its serial number</Text>
    
    <View style={styles.card}>
      {/* Feeder Dropdown */}
      <View style={styles.formRow}>
        <Text style={styles.label}>Select Feeder:</Text>
        {Platform.OS === 'ios' ? (
          <>
            <TouchableOpacity 
              style={[styles.picker, { justifyContent: 'center', paddingHorizontal: 12 }]}
              onPress={() => setShowIOSPicker(true)}
            >
              <Text style={{ 
                color: feederForm.selectedFeederId ? '#000' : '#999',
                fontSize: 16
              }}>
                {feederForm.selectedFeederId 
                  ? getFeederDisplayName(
                      availableFeeders.find(f => f.id.toString() === feederForm.selectedFeederId) || { id: parseInt(feederForm.selectedFeederId) },
                      availableFeeders
                    )
                  : "Select a feeder"}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={showIOSPicker}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.iosPickerModal}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={() => setShowIOSPicker(false)}>
                    <Text style={styles.iosPickerDoneBtn}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={feederForm.selectedFeederId}
                  onValueChange={(itemValue: string) => {
                    updateFeederField('selectedFeederId', itemValue);
                    setShowIOSPicker(false);
                  }}
                  style={styles.iosPickerContent}
                >
                  <Picker.Item label="Select a feeder" value="" />
                  {availableFeeders.map((feeder) => (
                    <Picker.Item 
                      key={feeder.id.toString()} 
                      label={getFeederDisplayName(feeder, availableFeeders)}
                      value={feeder.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </Modal>
          </>
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={feederForm.selectedFeederId}
              style={styles.picker}
              onValueChange={(itemValue: string) => updateFeederField('selectedFeederId', itemValue)}
            >
              <Picker.Item label="Select a feeder" value="" />
              {availableFeeders.map((feeder) => (
                <Picker.Item 
                  key={feeder.id.toString()} 
                  label={getFeederDisplayName(feeder, availableFeeders)}
                  value={feeder.id.toString()}
                />
              ))}
            </Picker>
          </View>
        )}
      </View>
      
      {/* Hardware ID (Serial) Input */}
      <View style={styles.formRow}>
        <Text style={styles.label}>Serial Number:</Text>
        <TextInput
          style={styles.input}
          value={feederForm.hardwareId}
          onChangeText={(value) => updateFeederField('hardwareId', value)}
          placeholder="Enter Serial Number"
        />
        <Text style={styles.helperText}>Format: XX-XX-XX-XX-XX-XX or XXXXXXXXXXXX (12 digits, provided on Setup)</Text>
      </View>
      
      <Button 
        title={assigning ? "Linking..." : "Link Feeder"}
        variant="primary"
        onPress={handleLinkFeeder}
        isLoading={assigning}
        disabled={assigning || !feederForm.selectedFeederId.trim() || !feederForm.hardwareId.trim()}
        style={[styles.button, styles.centeredButton]}
      />
      
      {/* Helper text to provide additional guidance */}
      <Text style={[styles.helperText, { textAlign: 'center', marginTop: 10 }]}>
        {assigning ? 'Connecting to feeder device...' : 'This will associate the hardware device with your account'}
      </Text>
    </View>
  </View>
));

export default React.memo(ProfilePageComponent);