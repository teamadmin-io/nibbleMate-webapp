import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Platform, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import FeedbackModal from '../components/FeedbackModal';
import { showFeedback, ModalType } from '../utils/helpers/feedbackHelpers';
import { useCreateFeederSelector, useFoodBrandsSelector, useFeedersSelector } from '../utils/features/demo/hookSelector';
import { WEB_PLATFORM_CONFIG } from '../constants';
import CrossPlatformModal from '../components/CrossPlatformModal';

const CreateFeeder = React.memo((): JSX.Element => {
  const [foodBrand, setFoodBrand] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { create, loading: creatingFeeder } = useCreateFeederSelector();
  const { foodBrands, loading: loadingBrands, error } = useFoodBrandsSelector();
  const { feeders, loading: loadingFeeders } = useFeedersSelector();
  const router = useRouter();
  const buttonRef = useRef<View>(null);
  const [buttonWidth, setButtonWidth] = useState(300);
  const { width: screenWidth } = Dimensions.get('window');
  const maxButtonWidth = Math.min(400, screenWidth * 0.9);

  // Modal state (for web only)
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>(ModalType.SUCCESS);

  // Measure button width to match dropdown width
  useEffect(() => {
    // Default width for the dropdown
    setButtonWidth(maxButtonWidth);
  }, [maxButtonWidth]);

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

  // Helper function to generate a unique feeder name
  const generateUniqueName = useCallback((brandName: string) => {
    // Base name without any number suffix
    const baseName = `My ${brandName} Feeder`;
    
    // If no feeders exist or are still loading, return the base name
    if (!feeders || feeders.length === 0) {
      return baseName;
    }
    
    // Check if the base name already exists
    const existingNames = feeders
      .map(feeder => feeder.name)
      .filter((name): name is string => name !== null && name !== undefined);
    
    // If the base name doesn't exist yet, use it
    if (!existingNames.includes(baseName)) {
      return baseName;
    }
    
    // Find all existing names that match the pattern 'My Brand Feeder X'
    const nameRegex = new RegExp(`^${baseName}( \\d+)?$`);
    const matchingNames = existingNames.filter(name => nameRegex.test(name));
    
    // Find the highest number suffix
    let highestSuffix = 0;
    matchingNames.forEach(name => {
      // Extract the number suffix if it exists
      const match = name.match(/(\d+)$/);
      if (match) {
        const suffix = parseInt(match[1], 10);
        if (suffix > highestSuffix) {
          highestSuffix = suffix;
        }
      }
    });
    
    // Generate a new name with the next number suffix
    return `${baseName} ${highestSuffix + 1}`;
  }, [feeders]);

  // Memoize selectFoodBrand to prevent recreation on each render
  const selectFoodBrand = useCallback((brand: string) => {
    setFoodBrand(brand);
    setShowDropdown(false);
  }, []);

  // Memoize handleCreateFeeder to prevent recreation on each render
  const handleCreateFeeder = useCallback(async () => {
    // Validate input
    if (!foodBrand.trim()) {
      if (Platform.OS === 'web') {
        handleShowFeedback('Error', 'Please select a food brand', ModalType.ERROR);
      }
      return;
    }
    
    // We don't directly check feeder name here as it's initially default in the system
    // But we should exclude the reserved food brand name to be safe
    if (foodBrand.startsWith('DISASSOCIATED:')) {
      if (Platform.OS === 'web') {
        handleShowFeedback('Error', 'This name prefix is reserved for system use', ModalType.ERROR);
      }
      return;
    }
    
    try {
      // Generate a unique name for the feeder
      const uniqueName = generateUniqueName(foodBrand);
      
      // Skip native alerts on web platform
      const skipAlert = Platform.OS === 'web';
      const result = await create(foodBrand, skipAlert, uniqueName);
      
      // Only show success if create was actually successful
      if (result) {
        // Show success feedback with custom modal on web
        if (Platform.OS === 'web') {
          handleShowFeedback('Success', `Feeder "${uniqueName}" created successfully!`, ModalType.SUCCESS);
          // Increase navigation delay to ensure modal is visible for a sufficient time
          setTimeout(() => router.push('/screens/MainPage'), 2500);
        }
      }
    } catch (e: any) {
      console.error('Create feeder error:', e);
      if (Platform.OS === 'web') {
        // Display a more user-friendly error message
        let errorMsg = 'Failed to create feeder';
        
        if (e.message.includes('not found')) {
          errorMsg = `Food brand "${foodBrand}" not found in the system. Please contact support.`;
        } else if (e.message.includes('required fields')) {
          errorMsg = 'Server error: Missing required fields. Please try again or contact support.';
        } else if (e.message.includes('row-level security policy')) {
          errorMsg = 'Permission error: You do not have permission to create a feeder. Please contact support.';
        } else if (e.message.includes('Database error')) {
          errorMsg = 'Database error: Unable to create feeder. Please contact support.';
        }
        
        handleShowFeedback('Error', errorMsg, ModalType.ERROR);
      }
    }
  }, [foodBrand, create, router, handleShowFeedback, generateUniqueName]);

  // Memoize modalDismiss to prevent recreation on each render
  const modalDismiss = useCallback(() => setShowModal(false), []);

  // Memoize isLoading calculation
  const isLoading = useMemo(() => creatingFeeder || loadingBrands, [creatingFeeder, loadingBrands]);

  // Memoize dropdown toggle function
  const toggleDropdown = useCallback(() => setShowDropdown(prev => !prev), []);

  // Memoize button style to avoid recreating on each render
  const buttonStyle = useMemo(() => ({ width: buttonWidth }), [buttonWidth]);

  // Memoize FoodBrandOption component to prevent unnecessary re-renders
  const FoodBrandOption = React.memo(({ brand, selectedBrand, onSelect }: { 
    brand: string; 
    selectedBrand: string;
    onSelect: (brand: string) => void;
  }) => {
    // Memoize the selection handler
    const handleSelect = useCallback(() => onSelect(brand), [brand, onSelect]);
    
    return (
      <TouchableOpacity
        style={[
          styles.dropdownItem,
          selectedBrand === brand && styles.dropdownItemSelected
        ]}
        onPress={handleSelect}
      >
        <Text style={[
          styles.dropdownItemText,
          selectedBrand === brand && styles.dropdownItemTextSelected
        ]}>
          {brand}
        </Text>
      </TouchableOpacity>
    );
  });
  
  // Memoize the dropdown component to reduce re-renders
  const FoodBrandDropdown = React.memo(({ 
    visible, 
    foodBrands, 
    selectedBrand, 
    onSelect 
  }: {
    visible: boolean;
    foodBrands: any[];
    selectedBrand: string;
    onSelect: (brand: string) => void;
  }) => {
    if (!visible) return null;
    
    // Use CrossPlatformModal to display the dropdown with a grayed-out background
    return (
      <CrossPlatformModal
        visible={visible}
        onClose={() => setShowDropdown(false)}
        title="Select Food Brand"
        modalStyle={styles.foodBrandModal}
        isDropdown={true}
      >
        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
          {foodBrands.length > 0 ? (
            foodBrands.map(brand => (
              <FoodBrandOption 
                key={brand.brandName} 
                brand={brand.brandName} 
                selectedBrand={selectedBrand}
                onSelect={onSelect}
              />
            ))
          ) : (
            <View style={{ padding: 12 }}>
              <Text style={{ color: '#999' }}>No food brands available</Text>
            </View>
          )}
        </ScrollView>
      </CrossPlatformModal>
    );
  });

  // Add display names for debugging
  FoodBrandOption.displayName = 'FoodBrandOption';
  FoodBrandDropdown.displayName = 'FoodBrandDropdown';

  return (
    <View style={GlobalStyles.container}>
      {/* Feedback Modal (for web only) */}
      <FeedbackModal
        visible={showModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onDismiss={modalDismiss}
      />
      
      <View style={GlobalStyles.responsiveContentContainer}>
        <Text style={GlobalStyles.title}>Create Feeder</Text>
        <Text style={styles.instructions}>
          Creating your virtual feeder is the first step. You'll need to link it to hardware and add cats later.
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading food brands. Please try again.</Text>
          </View>
        )}
        
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <>
            <View style={styles.formContainer}>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={toggleDropdown}
                >
                  <Text style={foodBrand ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                    {foodBrand || "Select Food Brand"}
                  </Text>
                </TouchableOpacity>
                
                {/* Use the extracted dropdown component */}
                <FoodBrandDropdown
                  visible={showDropdown}
                  foodBrands={foodBrands}
                  selectedBrand={foodBrand}
                  onSelect={selectFoodBrand}
                />
              </View>
              
              <View style={styles.buttonContainer} ref={buttonRef}>
                <Button 
                  title="Create Feeder"
                  variant="primary"
                  onPress={handleCreateFeeder}
                  disabled={isLoading || foodBrands.length === 0}
                  isLoading={creatingFeeder}
                  style={buttonStyle}
                />
              </View>
            </View>

            <View style={styles.instructionsBottomContainer}>
              <Text style={styles.instructionsTitle}>Next Steps:</Text>
              <Text style={styles.instructionsStep}>1. Go to Profile to link your feeder with a hardware serial number</Text>
              <Text style={styles.instructionsStep}>2. Add a cat in the Cats section</Text>
              <Text style={styles.instructionsStep}>3. Associate your cat with this feeder</Text>
              <Text style={styles.instructionsStep}>4. Configure your feeder's feeding schedule</Text>
              <Text style={[styles.instructionsStep, styles.catPoem]}>
                Cats are like functions: they return purrs when properly called but throw exceptions when parameters are invalid <Text style={styles.emoji}>😺</Text>
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 24
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginVertical: 10,
    position: 'relative',
    zIndex: Platform.OS === 'web' ? WEB_PLATFORM_CONFIG.z_index.dropdown : 1,
  },
  dropdownContainer: {
    position: 'relative',
    marginBottom: 20,
    zIndex: Platform.OS === 'web' ? WEB_PLATFORM_CONFIG.z_index.dropdown : 1,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center'
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: 16
  },
  dropdownSelectedText: {
    color: '#000',
    fontSize: 16
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    zIndex: Platform.OS === 'web' ? WEB_PLATFORM_CONFIG.z_index.dropdown : 2,
  },
  foodBrandModal: {
    zIndex: 2000,
    elevation: 10,
    maxHeight: '85%',
    maxWidth: 400,
    width: '95%',
    alignSelf: 'center',
  },
  dropdownScroll: {
    maxHeight: 500,
    width: '100%',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%',
  },
  dropdownItemSelected: {
    backgroundColor: '#e6f7ff'
  },
  dropdownItemText: {
    fontSize: 16
  },
  dropdownItemTextSelected: {
    fontWeight: 'bold',
    color: '#007bff'
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  errorContainer: {
    backgroundColor: '#ffcccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  errorText: {
    color: '#cc0000',
    textAlign: 'center'
  },
  instructionsBottomContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f7f9fa',
    borderRadius: 8,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    zIndex: Platform.OS === 'web' ? 1 : 0,
    position: 'relative',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  instructionsStep: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20
  },
  catPoem: {
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666'
  },
  emoji: {
    fontSize: 16
  }
});

// Add displayName for debugging
CreateFeeder.displayName = 'CreateFeeder';

export default CreateFeeder;