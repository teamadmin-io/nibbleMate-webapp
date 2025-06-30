import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, TextInput, Modal, Platform, StyleSheet, useWindowDimensions, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import FeedbackModal from '../components/FeedbackModal';
import { showFeedback, ModalType } from '../utils/helpers/feedbackHelpers';
import { useFeederSchedule, useUpdateFeederName, useFoodBrands, useFeeders, useUpdateFeederFeedAmount, useUpdateFeederFoodBrand } from '../utils/features/feeders/hooks';
import { fetchAllCats } from '../utils/features/cats/api';
import { ScheduleData } from '../utils/features/feeders/types';

// Define Cat type
interface Cat {
  catid: number;
  catname: string;
  catweight?: number | null;
  feederid: number | null;
}

// Define FoodBrand type
interface FoodBrand {
  brandName: string;
  servSize: number;
  calories: number;
}

// Day names for the week - both full and short versions
const DAYS_OF_WEEK = [
  { full: 'Mon', short: 'M' },
  { full: 'Tue', short: 'Tu' },
  { full: 'Wed', short: 'W' },
  { full: 'Thu', short: 'Th' },
  { full: 'Fri', short: 'F' },
  { full: 'Sat', short: 'Sa' },
  { full: 'Sun', short: 'Su' }
];

// Time slots available for selection (24-hour format)
const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

// Add type definition for styles
type SchedulerStyles = {
  scrollViewContent: ViewStyle;
  responsiveContainer: ViewStyle;
  header: ViewStyle;
  headerContainer: ViewStyle;
  titleContainer: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  editButton: ViewStyle;
  editButtonText: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  modalInput: TextStyle;
  modalButtonContainer: ViewStyle;
  modalButton: ViewStyle;
  feedNowContainer: ViewStyle;
  feedNowButton: ViewStyle;
  feedingTimesContainer: ViewStyle;
  sectionTitle: TextStyle;
  feedingTimesButtons: ViewStyle;
  webFeedAmountContainer: ViewStyle;
  webInputGroup: ViewStyle;
  webInputRow: ViewStyle;
  webInputLabel: TextStyle;
  webInputWrapper: ViewStyle;
  webInput: TextStyle;
  webInputUnit: TextStyle;
  webButtonGroup: ViewStyle;
  webButton: ViewStyle;
  activeInput: TextStyle;
  timeSlotRow: ViewStyle;
  timeCell: ViewStyle;
  timeText: TextStyle;
  scheduleCell: ViewStyle;
  selectedCell: ViewStyle;
  checkmark: TextStyle;
  mobileWebModal: ViewStyle;
  editNameContent: ViewStyle;
  editNameInput: TextStyle;
  editNameButtons: ViewStyle;
  editNameButton: ViewStyle;
  foodBrandModal: ViewStyle;
  modalOverlayFull: ViewStyle;
  foodBrandSelectorContent: ViewStyle;
  foodBrandOption: ViewStyle;
  foodBrandOptionContent: ViewStyle;
  foodBrandOptionName: TextStyle;
  selectedBrandName: TextStyle;
  foodBrandOptionDetails: TextStyle;
  foodBrandCancelButton: ViewStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  backButton: ViewStyle;
  catInfoContainer: ViewStyle;
  catInfoText: TextStyle;
  catName: TextStyle;
  manualFeedContainer: ViewStyle;
  settingRow: ViewStyle;
  settingLabel: TextStyle;
  settingValue: ViewStyle;
  valueGroup: ViewStyle;
  valueText: TextStyle;
  nutritionInfo: TextStyle;
  editButtonContainer: ViewStyle;
  lastSettingRow: ViewStyle;
  editingContainer: ViewStyle;
  iosInputRow: ViewStyle;
  iosInputContainer: ViewStyle;
  iosInput: TextStyle;
  manualFeedInputUnit: TextStyle;
  manualFeedEquals: TextStyle;
  iosButtonsContainer: ViewStyle;
  iosButton: ViewStyle;
  scheduleContainer: ViewStyle;
  scheduleDescription: TextStyle;
  daysHeaderRow: ViewStyle;
  timeHeaderCell: ViewStyle;
  headerText: TextStyle;
  dayHeaderCell: ViewStyle;
  shortDayText: TextStyle;
  timeSlotsContainer: ViewStyle;
  saveButtonContainer: ViewStyle;
  saveButton: ViewStyle;
};

const Scheduler = (): JSX.Element => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // Refs to prevent infinite focus effect
  const isMountedRef = useRef(true);
  const hasFetchedDataRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for cat data
  const [associatedCat, setAssociatedCat] = useState<Cat | null>(null);
  const [loadingCat, setLoadingCat] = useState(false);
  
  // Use feeders hook to get the current feeder details
  const { feeders, refetch: refetchFeeders } = useFeeders();
  const [currentFeeder, setCurrentFeeder] = useState<any>(null);
  
  // State for food brand data
  const { foodBrands, loading: loadingFoodBrands } = useFoodBrands();
  const [currentFeederFoodBrand, setCurrentFeederFoodBrand] = useState<FoodBrand | null>(null);
  
  // State for manual feeding
  const [manualFeedCalories, setManualFeedCalories] = useState<number>(0);
  const [manualFeedGrams, setManualFeedGrams] = useState<number>(0);
  const [isEditingFeedAmount, setIsEditingFeedAmount] = useState(false);
  const [tempCalories, setTempCalories] = useState<string>('');
  const [tempGrams, setTempGrams] = useState<string>('');
  const [editingField, setEditingField] = useState<'calories' | 'grams'>('calories');
  
  // Error state for schedule loading
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  
  // Responsive layout state with properly typed values
  const [containerWidth, setContainerWidth] = useState<number>(width);
  const [horizontalPadding, setHorizontalPadding] = useState(0);
  const [maxContentWidth, setMaxContentWidth] = useState(1200);
  
  // Add the feed amount update hook
  const { updateFeedAmount, loading: updatingFeedAmount } = useUpdateFeederFeedAmount();
  
  // State for food brand selection
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [selectedFoodBrand, setSelectedFoodBrand] = useState('');
  
  // State for food brand editing
  const [isEditingFoodBrand, setIsEditingFoodBrand] = useState(false);
  
  // Add the food brand update hook
  const { updateFoodBrand, loading: updatingFoodBrand } = useUpdateFeederFoodBrand();
  
  // Handle responsive layout based on screen size - convert to useMemo
  const responsiveLayout = useMemo(() => {
    let containerWidth = width;
    let horizontalPadding = 16;
    let maxContentWidth = 1200;

    if (Platform.OS !== 'web') {
      // On native mobile platforms, use full width with minimal padding
      containerWidth = width;
      horizontalPadding = 16;
      maxContentWidth = 10000; // No practical limit
    } else {
      // On web, adjust based on viewport width
      if (width < 600) {
        // Mobile web
        containerWidth = width;
        horizontalPadding = 16;
      } else if (width < 960) {
        // Tablet
        containerWidth = width * 0.9;
        horizontalPadding = 24;
      } else if (width < 1280) {
        // Small desktop
        containerWidth = width * 0.85;
        horizontalPadding = 32;
      } else {
        // Large desktop
        containerWidth = width * 0.8;
        horizontalPadding = 40;
      }
      
      // Set maximum content width for very large screens
      maxContentWidth = 1200;
    }

    return { containerWidth, horizontalPadding, maxContentWidth };
  }, [width]);

  // Update state values from the memoized calculation
  useEffect(() => {
    setContainerWidth(responsiveLayout.containerWidth);
    setHorizontalPadding(responsiveLayout.horizontalPadding);
    setMaxContentWidth(responsiveLayout.maxContentWidth);
  }, [responsiveLayout]);
  
  // Safely extract and convert parameters
  const rawFeederId = params.feederId;
  const rawFeederName = params.feederName;
  
  // Process the parameters to handle arrays
  const processedFeederId = Array.isArray(rawFeederId) ? rawFeederId[0] : rawFeederId;
  const [feederName, setFeederName] = useState(Array.isArray(rawFeederName) ? rawFeederName[0] : rawFeederName);
  
  // State for name editing
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(feederName || '');
  const { updateName, loading: updatingName } = useUpdateFeederName();
  
  // Use the feeder schedule hook with the processed ID
  const { 
    schedule, 
    scheduleId, 
    loading, 
    saving, 
    error: scheduleHookError,
    setSchedule, 
    saveSchedule, 
    feedNow,
    fetchSchedule
  } = useFeederSchedule(processedFeederId);
  
  // Effect for initial data fetch
  useEffect(() => {
    isMountedRef.current = true;
    
    // Set a timeout to prevent infinite loading state
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && loading) {
        setScheduleError("Unable to load schedule data. Please try again later.");
      }
    }, 15000); // 15 second timeout
    
    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Clear timeout when loading state changes
  useEffect(() => {
    if (!loading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [loading]);
  
  // Effect to handle schedule hook errors
  useEffect(() => {
    if (scheduleHookError) {
      setScheduleError(`Error loading schedule: ${scheduleHookError.message}`);
    }
  }, [scheduleHookError]);
  
  // Helper function to find cat by feeder ID
  const fetchAssociatedCat = async () => {
    if (!isMountedRef.current || !processedFeederId) return;
    
    try {
      setLoadingCat(true);
      const cats = await fetchAllCats();
      if (isMountedRef.current && cats && Array.isArray(cats)) {
        const cat = cats.find(c => c.feederid === Number(processedFeederId));
        setAssociatedCat(cat || null);
      }
    } catch (error) {
      console.error('Error fetching associated cat:', error);
    } finally {
      if (isMountedRef.current) {
        setLoadingCat(false);
      }
    }
  };
  
  // Optimize findFeederFoodBrand by memoizing it
  const findFeederFoodBrand = useCallback(() => {
    if (!feeders || !feeders.length || !foodBrands.length || !processedFeederId) {
      return;
    }
    
    // Find the current feeder from the feeders list
    const feeder = feeders.find(f => f.id === Number(processedFeederId));
    if (!feeder) return;
    
    // Store the current feeder
    setCurrentFeeder(feeder);
    
    // Get the brand name from the feeder
    const brandName = feeder.brandname;
    if (!brandName) return;
    
    // Find the food brand details
    const foodBrand = foodBrands.find(brand => brand.brandName === brandName);
    setCurrentFeederFoodBrand(foodBrand || null);
    
    // Set manual feed amounts from feeder data
    const calories = feeder.manual_feed_calories ?? 20; // Default to 20 if not set
    setManualFeedCalories(calories);
    
    // Calculate grams based on calories if we have the food brand info
    if (foodBrand && foodBrand.calories > 0) {
      const gramsPerCalorie = foodBrand.servSize / foodBrand.calories;
      const grams = parseFloat((calories * gramsPerCalorie).toFixed(1));
      setManualFeedGrams(grams);
    }
  }, [feeders, foodBrands, processedFeederId]);
  
  // Convert between calories and grams
  const convertCaloriesToGrams = (calories: number): number => {
    if (!currentFeederFoodBrand || currentFeederFoodBrand.calories <= 0) return 0;
    const gramsPerCalorie = currentFeederFoodBrand.servSize / currentFeederFoodBrand.calories;
    return parseFloat((calories * gramsPerCalorie).toFixed(1));
  };
  
  const convertGramsToCalories = (grams: number): number => {
    if (!currentFeederFoodBrand || currentFeederFoodBrand.servSize <= 0) return 0;
    const caloriesPerGram = currentFeederFoodBrand.calories / currentFeederFoodBrand.servSize;
    return Math.round(grams * caloriesPerGram);
  };
  
  // Handle calorie input change
  const handleCalorieChange = (value: string) => {
    setTempCalories(value);
    
    const calories = parseInt(value);
    if (!isNaN(calories) && calories >= 0) {
      const grams = convertCaloriesToGrams(calories);
      setTempGrams(grams.toString());
    }
  };
  
  // Handle gram input change
  const handleGramChange = (value: string) => {
    setTempGrams(value);
    
    const grams = parseFloat(value);
    if (!isNaN(grams) && grams >= 0) {
      const calories = convertGramsToCalories(grams);
      setTempCalories(calories.toString());
    }
  };
  
  // Update saveManualFeedAmount to persist to the database
  const saveManualFeedAmount = async () => {
    const calories = parseInt(tempCalories);
    
    if (isNaN(calories) || calories < 0) {
      handleShowFeedback(
        "Invalid Input",
        "Please enter a valid positive number for calories.",
        ModalType.ERROR
      );
      return;
    }
    
    // Update the database first
    const skipAlert = Platform.OS === 'web';
    const success = await updateFeedAmount(Number(processedFeederId), calories, skipAlert);
    
    if (success) {
      setManualFeedCalories(calories);
      setManualFeedGrams(convertCaloriesToGrams(calories));
      setIsEditingFeedAmount(false);
      
      if (Platform.OS === 'web') {
        handleShowFeedback(
          "Success",
          "Feed amount updated successfully!",
          ModalType.SUCCESS
        );
      }
      
      // Refresh feeders to get the updated data
      refetchFeeders();
    }
  };
  
  // Start editing feed amount
  const startEditingFeedAmount = (field: 'calories' | 'grams') => {
    setEditingField(field);
    setTempCalories(manualFeedCalories.toString());
    setTempGrams(manualFeedGrams.toString());
    setIsEditingFeedAmount(true);
  };
  
  // Cancel editing feed amount
  const cancelEditingFeedAmount = () => {
    setIsEditingFeedAmount(false);
  };
  
  // Manually fetch data once
  const fetchDataOnce = useCallback(() => {
    if (!hasFetchedDataRef.current) {
      console.log('Performing initial fetch of scheduler data');
      fetchAssociatedCat();
      hasFetchedDataRef.current = true;
    }
  }, [fetchAssociatedCat]);
  
  // Retry loading if there was an error
  const retryLoading = useCallback(() => {
    setScheduleError(null);
    fetchSchedule();
    fetchAssociatedCat();
    refetchFeeders();
  }, [fetchAssociatedCat, fetchSchedule, refetchFeeders]);
  
  // Fetch data when feeder ID changes
  useEffect(() => {
    if (processedFeederId) {
      fetchDataOnce();
    }
  }, [processedFeederId, fetchDataOnce]);
  
  // Update food brand data when relevant data changes
  useEffect(() => {
    if (foodBrands.length > 0 && feeders.length > 0 && processedFeederId) {
      // Debug info removed for production
      findFeederFoodBrand();
    }
  }, [schedule, foodBrands, feeders, processedFeederId]);
  
  // Refresh schedule and cat data when the page comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Scheduler screen focused');
      // Only refetch on subsequent focuses, not the initial one
      if (hasFetchedDataRef.current) {
        console.log('Refreshing scheduler data on focus');
        fetchSchedule();
        fetchAssociatedCat();
        refetchFeeders();
      } else {
        fetchDataOnce();
      }
      
      return () => {
        console.log('Scheduler screen unfocused');
      };
    }, [])
  );
  
  // Use width from useWindowDimensions instead of Dimensions.get
  const useShortDayNames = width < 500; // Increased threshold to ensure short names on iOS
  
  // Modal state (for web only)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>(ModalType.SUCCESS);
  
  // Helper function to show feedback
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
  
  // Check if a time slot is selected for a specific day
  const isTimeSelected = useCallback((day: string, time: string): boolean => {
    if (!schedule?.schedule[day]) return false;
    return schedule.schedule[day].includes(time);
  }, [schedule]);

  // Function to toggle a time slot for a specific day
  const toggleTimeSlot = useCallback((day: string, time: string) => {
    if (!schedule) return;
    
    setSchedule((prevSchedule: ScheduleData | null) => {
      if (!prevSchedule) return prevSchedule;
      
      const updatedDaySchedule = [...(prevSchedule.schedule[day] || [])];
      
      // If the time is already scheduled, remove it
      if (updatedDaySchedule.includes(time)) {
        return {
          name: prevSchedule.name,
          schedule: {
            ...prevSchedule.schedule,
            [day]: updatedDaySchedule.filter(t => t !== time)
          },
          manualFeedCalories: prevSchedule.manualFeedCalories,
          feedingTimes: prevSchedule.feedingTimes,
          lastUpdated: prevSchedule.lastUpdated
        };
      } 
      
      // Add the new time and sort
      return {
        name: prevSchedule.name,
        schedule: {
          ...prevSchedule.schedule,
          [day]: [...updatedDaySchedule, time].sort()
        },
        manualFeedCalories: prevSchedule.manualFeedCalories,
        feedingTimes: prevSchedule.feedingTimes,
        lastUpdated: prevSchedule.lastUpdated
      };
    });
  }, [schedule, setSchedule]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);
  
  // Handle the "Feed Now" action
  const handleFeedNow = () => {
    const confirmAndFeed = async () => {
      try {
        // Skip native alerts in the feedNow function
        const success = await feedNow(true, manualFeedCalories);
        
        // Show success feedback
        if (Platform.OS === 'web') {
          handleShowFeedback(
            "Success",
            `Food dispensed successfully! (${manualFeedCalories} calories)`,
            ModalType.SUCCESS
          );
        } else {
          Alert.alert(
            "Success",
            `Food dispensed successfully! (${manualFeedCalories} calories)`,
            [{ text: "OK" }]
          );
        }
      } catch (error: any) {
        // Show error feedback
        const errorMessage = error.message || "Failed to dispense food. Please try again.";
        if (Platform.OS === 'web') {
          handleShowFeedback("Error", errorMessage, ModalType.ERROR);
        } else {
          Alert.alert("Error", errorMessage);
        }
      }
    };
    
    if (Platform.OS === 'web') {
      // For web, show confirmation that requires user interaction before feeding
      // We need to implement a proper confirmation dialog for web
      if (window.confirm(`Are you sure you want to dispense ${manualFeedCalories} calories (${manualFeedGrams}g) now?`)) {
        confirmAndFeed();
      }
    } else {
      // For native, use Alert for confirmation
      Alert.alert(
        "Confirm Feeding",
        `Are you sure you want to dispense ${manualFeedCalories} calories (${manualFeedGrams}g) now?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Feed", onPress: confirmAndFeed }
        ]
      );
    }
  };

  // Update the handleSaveSchedule function
  const handleSaveSchedule = useCallback(async () => {
    if (!schedule) return;
    
    // Clear any schedule error that might be displayed
    setScheduleError(null);
    
    try {
      // Make sure the manual feed calories are in the schedule
      const updatedSchedule = {
        ...schedule,
        manualFeedCalories: manualFeedCalories
      };
      
      // Skip built-in alerts from saveSchedule function as we'll handle feedback consistently here
      const skipAlert = true;
      await saveSchedule(updatedSchedule, skipAlert);
      
      // Show success feedback on all platforms
      if (Platform.OS === 'web') {
        handleShowFeedback(
          "Success",
          "Your feeding schedule has been saved successfully.",
          ModalType.SUCCESS
        );
      } else {
        // For native platforms, show an alert
        Alert.alert(
          "Success",
          "Your feeding schedule has been saved successfully.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      // Show error feedback on all platforms
      const errorMessage = error.message || "Failed to save schedule. Please try again.";
      if (Platform.OS === 'web') {
        handleShowFeedback(
          "Error",
          errorMessage,
          ModalType.ERROR
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    }
  }, [schedule, manualFeedCalories, saveSchedule, handleShowFeedback]);

  // Helper function to check if a feeder name already exists
  const isFeederNameTaken = useCallback((name: string): boolean => {
    if (!feeders || feeders.length === 0) return false;
    
    // Filter out the current feeder (don't consider the current feeder's name as a duplicate)
    const otherFeeders = feeders.filter(feeder => feeder.id !== Number(processedFeederId));
    
    // Check if any other feeder has the same name
    return otherFeeders.some(feeder => 
      feeder.name && feeder.name.toLowerCase() === name.toLowerCase()
    );
  }, [feeders, processedFeederId]);

  // Update the feeder name in the database and local state
  const handleNameChange = async (newName: string) => {
    // Clear any schedule error that might be displayed
    setScheduleError(null);
    
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    
    // Prevent using reserved prefix in feeder names
    if (trimmedName.startsWith('DISASSOCIATED:')) {
      handleShowFeedback(
        "Error",
        "This name prefix is reserved for system use",
        ModalType.ERROR
      );
      return;
    }
    
    // Check if the name is already taken by another feeder
    if (isFeederNameTaken(trimmedName)) {
      handleShowFeedback(
        "Error",
        "This feeder name is already taken. Please choose a unique name.",
        ModalType.ERROR
      );
      return;
    }
    
    try {
      // Skip built-in alerts in the update function
      const skipAlert = true;
      const success = await updateName(Number(processedFeederId), trimmedName, undefined, skipAlert);
      
      if (success) {
        // Update local state
        setFeederName(trimmedName);
        setNewName(trimmedName);
        setIsEditing(false);
        
        // Show success feedback on all platforms
        if (Platform.OS === 'web') {
          handleShowFeedback(
            "Success",
            "Feeder name updated successfully!",
            ModalType.SUCCESS
          );
        } else {
          Alert.alert(
            "Success",
            "Feeder name updated successfully!",
            [{ text: "OK" }]
          );
        }
        
        // Refresh feeders to get updated data
        refetchFeeders();
      }
    } catch (error: any) {
      // Show error feedback on all platforms
      const errorMessage = error.message || "Failed to update feeder name. Please try again.";
      if (Platform.OS === 'web') {
        handleShowFeedback(
          "Error",
          errorMessage,
          ModalType.ERROR
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    }
  };

  // Select food brand
  const selectFoodBrand = async (brand: string) => {
    setSelectedFoodBrand(brand);
    setShowFoodDropdown(false);
    
    // Find the food brand details
    const foodBrand = foodBrands.find(b => b.brandName === brand);
    if (foodBrand) {
      setCurrentFeederFoodBrand(foodBrand);
      
      // Recalculate the amounts based on new food brand
      if (manualFeedCalories > 0) {
        const newGrams = convertCaloriesToGrams(manualFeedCalories);
        setManualFeedGrams(newGrams);
      }
    }
  };

  // Update handleFoodBrandChange function
  const handleFoodBrandChange = useCallback(async (brandName: string) => {
    try {
      // Skip built-in alerts in the update function
      const skipAlert = true;
      const success = await updateFoodBrand(Number(processedFeederId), brandName, skipAlert);
      
      if (success) {
        const foodBrand = foodBrands.find(b => b.brandName === brandName);
        if (foodBrand) {
          setCurrentFeederFoodBrand(foodBrand);
          setIsEditingFoodBrand(false);
          
          // Show success feedback on all platforms
          if (Platform.OS === 'web') {
            handleShowFeedback(
              "Success",
              "Food brand updated successfully!",
              ModalType.SUCCESS
            );
          } else {
            Alert.alert(
              "Success",
              "Food brand updated successfully!",
              [{ text: "OK" }]
            );
          }
          
          // Refresh feeders to get updated data
          refetchFeeders();
        }
      }
    } catch (error: any) {
      // Show error feedback on all platforms
      const errorMessage = error.message || "Failed to update food brand. Please try again.";
      if (Platform.OS === 'web') {
        handleShowFeedback(
          "Error",
          errorMessage,
          ModalType.ERROR
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    }
  }, [foodBrands, handleShowFeedback, processedFeederId, refetchFeeders, updateFoodBrand]);

  // Memoize modalDismiss callback
  const modalDismiss = useCallback(() => setShowFeedbackModal(false), []);

  // Use separate style objects to avoid type issues
  const responsiveStyle = useMemo(() => ({
    paddingHorizontal: horizontalPadding,
    maxWidth: maxContentWidth
  }), [horizontalPadding, maxContentWidth]);

  // Create memoized TimeSlotRow component
  const TimeSlotRow = React.memo(({ time }: { time: string }) => (
    <View key={time} style={styles.timeSlotRow}>
      <View style={styles.timeCell}>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      {DAYS_OF_WEEK.map(day => (
        <TouchableOpacity
          key={`${day.full}-${time}`}
          style={[
            styles.scheduleCell,
            isTimeSelected(day.full, time) && styles.selectedCell
          ]}
          onPress={() => toggleTimeSlot(day.full, time)}
        >
          {isTimeSelected(day.full, time) && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  ));

  // Add display name for debugging
  TimeSlotRow.displayName = 'TimeSlotRow';

  // Extract and memoize the NameEditModal component
  const NameEditModal = React.memo(({ 
    isVisible, 
    currentName, 
    onSave, 
    onCancel, 
    isLoading 
  }: {
    isVisible: boolean;
    currentName: string;
    onSave: (name: string) => void;
    onCancel: () => void;
    isLoading: boolean;
  }) => {
    const [name, setName] = useState(currentName);
    const inputRef = useRef<TextInput>(null);

    // Reset input value when modal opens with new currentName
    useEffect(() => {
      setName(currentName);
    }, [currentName]);

    // Focus the input when the modal becomes visible
    useEffect(() => {
      if (isVisible) {
        // Small delay to ensure modal is fully rendered before focusing
        const timer = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }, [isVisible]);

    // Import the CrossPlatformModal at the top of the file
    const CrossPlatformModal = require('../components/CrossPlatformModal').default;

    // Use CrossPlatformModal for better mobile support
    if (isVisible) {
      return (
        <CrossPlatformModal
          visible={isVisible}
          onClose={onCancel}
          title="Edit Feeder Name"
          avoidKeyboard={true}
          modalStyle={Platform.OS === 'web' && Dimensions.get('window').width < 600 ? styles.mobileWebModal : undefined}
        >
          <View style={styles.editNameContent}>
            <TextInput
              ref={inputRef}
              style={styles.editNameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter feeder name"
              enterKeyHint="done"
              autoCapitalize="none"
              spellCheck={false}
              onSubmitEditing={() => name.trim() && onSave(name)}
              autoFocus={Platform.OS === 'web'}
            />
            
            <View style={styles.editNameButtons}>
              <Button 
                title="Cancel" 
                variant="secondary"
                onPress={onCancel}
                style={styles.editNameButton}
              />
              <Button 
                title={isLoading ? "Saving..." : "Save"} 
                variant="primary"
                onPress={() => onSave(name)}
                disabled={isLoading || !name.trim()}
                style={styles.editNameButton}
              />
            </View>
          </View>
        </CrossPlatformModal>
      );
    }
    
    return null;
  });

  // Add displayName for debugging
  NameEditModal.displayName = 'NameEditModal';

  // Extract and memoize the FoodBrandSelector component
  const FoodBrandSelector = React.memo(({ 
    isVisible,
    foodBrands,
    currentBrand,
    onSelect,
    onCancel
  }: {
    isVisible: boolean;
    foodBrands: FoodBrand[];
    currentBrand: FoodBrand | null;
    onSelect: (brandName: string) => void;
    onCancel: () => void;
  }) => {
    if (!isVisible) return null;
    
    // Import CrossPlatformModal
    const CrossPlatformModal = require('../components/CrossPlatformModal').default;
    
    return (
      <CrossPlatformModal
        visible={isVisible}
        onClose={onCancel}
        title="Select Food Brand"
        showCloseButton={true}
        modalStyle={styles.foodBrandModal}
        overlayStyle={styles.modalOverlayFull}
        isDropdown={true}
      >
        <View style={styles.foodBrandSelectorContent}>
          {foodBrands.map((brand, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.foodBrandOption,
                { borderBottomWidth: index < foodBrands.length - 1 ? 1 : 0 }
              ]}
              onPress={() => onSelect(brand.brandName)}
            >
              <View style={styles.foodBrandOptionContent}>
                <Text style={[
                  styles.foodBrandOptionName,
                  currentBrand?.brandName === brand.brandName && styles.selectedBrandName
                ]}>
                  {brand.brandName}
                </Text>
                <Text style={styles.foodBrandOptionDetails}>
                  {brand.calories} kcal/kg • {brand.servSize}g serving
                </Text>
              </View>
              {currentBrand?.brandName === brand.brandName && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            style={styles.foodBrandCancelButton}
          />
        </View>
      </CrossPlatformModal>
    );
  });

  // Add displayName for debugging
  FoodBrandSelector.displayName = 'FoodBrandSelector';

  // Render error state instead of just showing a spinner forever
  if (scheduleError) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{scheduleError}</Text>
          <Button 
            title="Retry" 
            variant="primary" 
            onPress={retryLoading} 
            style={styles.retryButton}
          />
          <Button 
            title="Go Back" 
            variant="secondary" 
            onPress={() => router.back()} 
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  if (loading || !schedule) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      {/* Feedback Modal (for web only) */}
      <FeedbackModal
        visible={showFeedbackModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onDismiss={modalDismiss}
      />
      
      {/* Food Brand Selector - Move to top level for proper z-index stacking */}
      {isEditingFoodBrand && (
        <FoodBrandSelector
          isVisible={isEditingFoodBrand}
          foodBrands={foodBrands}
          currentBrand={currentFeederFoodBrand}
          onSelect={handleFoodBrandChange}
          onCancel={() => setIsEditingFoodBrand(false)}
        />
      )}
      
      <ScrollView 
        style={GlobalStyles.schedulerScrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={[styles.responsiveContainer, responsiveStyle, { width: containerWidth }]}>
        {/* Add header section with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={GlobalStyles.backButton} 
            onPress={goBack}
          >
            <Text style={GlobalStyles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={[GlobalStyles.title, styles.title]}>
              {feederName || 'Feeder Schedule'}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>✎</Text>
            </TouchableOpacity>
          </View>
          <Text style={[GlobalStyles.subtitle, styles.subtitle]}>
            Feeder ID: {processedFeederId}
          </Text>
          
          {/* Display associated cat information if available */}
          {associatedCat && (
            <View style={styles.catInfoContainer}>
              <Text style={styles.catInfoText}>
                For cat: <Text style={styles.catName}>{associatedCat.catname}</Text>
                {associatedCat.catweight ? ` • ${associatedCat.catweight} lbs` : ''}
              </Text>
            </View>
          )}
        </View>
        
        {/* Name Editing Modal */}
        <NameEditModal
          isVisible={isEditing}
          currentName={newName}
          onSave={handleNameChange}
          onCancel={() => {
            setNewName(feederName || '');
            setIsEditing(false);
          }}
          isLoading={updatingName}
        />
  
        {/* Feed Now Button */}
        <View style={styles.feedNowContainer}>
          <Button
            title="Feed Now"
            variant="primary"
            onPress={handleFeedNow}
            style={styles.feedNowButton}
            isLoading={saving}
            disabled={saving}
          />
        </View>
        
        {/* Update Feed Amount Section (formerly Manual Feed Amount) */}
        <View style={styles.manualFeedContainer}>
          {/* Food Brand Row */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Food Brand</Text>
            <View style={styles.settingValue}>
              <View style={styles.valueGroup}>
                <Text style={styles.valueText}>
                  {currentFeederFoodBrand?.brandName || 'Not set'}
                </Text>
                {currentFeederFoodBrand && (
                  <Text style={styles.nutritionInfo}>
                    {currentFeederFoodBrand.calories} kcal/kg • {currentFeederFoodBrand.servSize}g serving
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.editButtonContainer}
                onPress={() => setIsEditingFoodBrand(true)}
              >
                <Text style={styles.editButtonText}>✎</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feed Amount Row */}
          <View style={[styles.settingRow, styles.lastSettingRow]}>
            <Text style={styles.settingLabel}>Feed Amount</Text>
            <View style={styles.settingValue}>
              <Text style={styles.valueText}>
                {manualFeedCalories} kcal = {manualFeedGrams}g
              </Text>
              <TouchableOpacity
                style={styles.editButtonContainer}
                onPress={() => startEditingFeedAmount('calories')}
              >
                <Text style={styles.editButtonText}>✎</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isEditingFeedAmount && (
            <View style={styles.editingContainer}>
              {Platform.OS === 'web' ? (
                // Web layout - vertical for better mobile experience
                <View style={styles.webFeedAmountContainer}>
                  <View style={styles.webInputGroup}>
                    <View style={styles.webInputRow}>
                      <Text style={styles.webInputLabel}>Calories:</Text>
                      <View style={styles.webInputWrapper}>
                        <TextInput
                          style={[
                            styles.webInput,
                            editingField === 'calories' && styles.activeInput
                          ] as TextStyle[]}
                          value={tempCalories}
                          onChangeText={handleCalorieChange}
                          keyboardType="numeric"
                          inputMode="decimal"
                          onFocus={() => {
                            setEditingField('calories');
                            // Scroll to top when focusing calories input
                            if (Platform.OS === 'web') {
                              window.scrollTo(0, 0);
                            }
                          }}
                          placeholder="Enter calories"
                          autoFocus={Platform.OS === 'web'}
                        />
                        <Text style={styles.webInputUnit}>kcal</Text>
                      </View>
                    </View>

                    <View style={styles.webInputRow}>
                      <Text style={styles.webInputLabel}>Grams:</Text>
                      <View style={styles.webInputWrapper}>
                        <TextInput
                          style={[
                            styles.webInput,
                            editingField === 'grams' && styles.activeInput
                          ] as TextStyle[]}
                          value={tempGrams}
                          onChangeText={handleGramChange}
                          keyboardType="numeric"
                          inputMode="decimal"
                          onFocus={() => {
                            setEditingField('grams');
                            // Keep scroll position when focusing grams input
                          }}
                          placeholder="Enter grams"
                        />
                        <Text style={styles.webInputUnit}>g</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.webButtonGroup}>
                    <Button
                      title="Cancel"
                      variant="danger"
                      onPress={cancelEditingFeedAmount}
                      style={styles.webButton}
                    />
                    <Button
                      title="Save"
                      variant="primary"
                      onPress={saveManualFeedAmount}
                      style={styles.webButton}
                    />
                  </View>
                </View>
              ) : (
                // iOS layout - vertical with more space
                <View>
                  <View style={styles.iosInputRow}>
                    <View style={styles.iosInputContainer}>
                      <TextInput
                        style={[
                          styles.iosInput,
                          editingField === 'calories' && styles.activeInput
                        ]}
                        value={tempCalories}
                        onChangeText={handleCalorieChange}
                        keyboardType="numeric"
                        inputMode="decimal"
                        onFocus={() => setEditingField('calories')}
                        placeholder="Enter calories"
                      />
                      <Text style={styles.manualFeedInputUnit}>kcal</Text>
                    </View>
                    <Text style={styles.manualFeedEquals}>=</Text>
                    <View style={styles.iosInputContainer}>
                      <TextInput
                        style={[
                          styles.iosInput,
                          editingField === 'grams' && styles.activeInput
                        ]}
                        value={tempGrams}
                        onChangeText={handleGramChange}
                        keyboardType="numeric"
                        inputMode="decimal"
                        onFocus={() => setEditingField('grams')}
                        placeholder="Enter grams"
                      />
                      <Text style={styles.manualFeedInputUnit}>g</Text>
                    </View>
                  </View>
                  <View style={styles.iosButtonsContainer}>
                    <Button
                      title="Cancel"
                      variant="danger"
                      onPress={cancelEditingFeedAmount}
                      style={styles.iosButton}
                    />
                    <Button
                      title="Save"
                      variant="primary"
                      onPress={saveManualFeedAmount}
                      style={styles.iosButton}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Weekly Schedule Grid */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Text style={styles.scheduleDescription}>
            Select feeding times by tapping the cells. You can schedule as many feedings as needed for each day.
          </Text>
          
          {/* Days header row */}
          <View style={styles.daysHeaderRow}>
            <View style={styles.timeHeaderCell}>
              <Text style={styles.headerText}>Time</Text>
            </View>
            {DAYS_OF_WEEK.map(day => (
              <View key={day.full} style={styles.dayHeaderCell}>
                <Text style={[
                  styles.headerText,
                  useShortDayNames && styles.shortDayText
                ]}>
                  {useShortDayNames ? day.short : day.full}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Time slots grid */}
          <View style={styles.timeSlotsContainer}>
            {timeSlots.map(time => (
              <TimeSlotRow key={time} time={time} />
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <Button 
            title="Save Schedule" 
            variant="primary" 
            onPress={handleSaveSchedule}
            isLoading={saving}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>
      </View>
    </ScrollView>
  </View>
);
};

// Specific styles for the Scheduler page
const styles = StyleSheet.create<SchedulerStyles>({
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  responsiveContainer: {
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 0,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  editButton: {
    marginLeft: 10,
    padding: 5,
  },
  editButtonText: {
    fontSize: 18,
    transform: [{ scaleX: -1 }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '85%',
    maxWidth: 450,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    ...(Platform.OS === 'web' && {
      position: 'relative',
      top: -100,
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: Platform.OS === 'web' ? 44 : 40,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  feedNowContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  feedNowButton: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#007AFF',
  },
  feedingTimesContainer: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  feedingTimesButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  feedingTimeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  feedingTimeButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  feedingTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  feedingTimeTextSelected: {
    color: '#fff',
  },
  scheduleContainer: {
    width: '100%',
    marginBottom: 30,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  timeHeaderCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginLeft: 1,
    minWidth: 30,
    borderRadius: 4,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  shortDayText: {
    fontSize: 13, // Slightly smaller font for short day names
  },
  timeSlotsContainer: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: 1,
    height: 40,
  },
  timeCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scheduleCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    marginLeft: 1,
  },
  selectedCell: {
    backgroundColor: '#e0f7e0',
  },
  checkmark: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 30,
  },
  saveButton: {
    minWidth: 200,
    maxWidth: 300,
  },
  catInfoContainer: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignSelf: 'center',
  },
  catInfoText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
  },
  catName: {
    fontWeight: 'bold',
    color: '#212529',
  },
  manualFeedContainer: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastSettingRow: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
  },
  settingValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 8,
    maxWidth: '70%',
  },
  valueGroup: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'right',
  },
  nutritionInfo: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  editButtonContainer: {
    padding: 8,
    marginLeft: 4,
  },
  editingContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    ...(Platform.OS === 'web' && Dimensions.get('window').width < 600 ? {
      flexDirection: 'column',
      alignItems: 'stretch',
    } : {}),
  },
  manualFeedInputRow: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: Dimensions.get('window').width < 600 ? 'wrap' : 'nowrap',
    justifyContent: 'space-between',
  },
  manualFeedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    ...(Platform.OS === 'web' && Dimensions.get('window').width < 600 ? {
      marginBottom: 10,
      width: '100%',
    } : {}),
  },
  manualFeedInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 5,
    ...(Platform.OS === 'web' && {
      outlineWidth: 0,
      outlineColor: 'transparent',
      outlineStyle: 'none',
      flex: 1,
    }),
  },
  activeInput: {
    borderColor: '#000',
  },
  manualFeedInputUnit: {
    fontWeight: 'bold',
    color: '#212529',
  },
  manualFeedEquals: {
    marginHorizontal: 10,
    fontWeight: 'bold',
    color: '#212529',
  },
  manualFeedButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' && Dimensions.get('window').width < 600 ? {
      width: '100%',
      marginTop: 10,
    } : {}),
  },
  manualFeedButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  manualFeedDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  manualFeedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualFeedValue: {
    fontWeight: 'bold',
    color: '#212529',
  },
  manualFeedUnit: {
    fontWeight: 'normal',
    color: '#495057',
  },
  noFoodBrandText: {
    color: '#495057',
  },
  loadingFoodBrandText: {
    color: '#495057',
  },
  scheduleDescription: {
    marginBottom: 16,
    color: '#666',
    fontSize: 14,
  },
  feedAmountDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  foodBrandSection: {
    marginBottom: 20,
    position: 'relative',
  },
  foodBrandLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  dropdownContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
    overflow: 'hidden',
  },
  brandOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
  },
  brandOptionContent: {
    flex: 1,
    marginRight: 16,
  },
  brandOptionName: {
    fontSize: 17,
    color: '#000',
    marginBottom: 4,
  },
  selectedBrandName: {
    color: '#007AFF',
    fontWeight: '500',
  },
  brandOptionDetails: {
    fontSize: 13,
    color: '#666',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  expandedSection: {
    backgroundColor: '#f8f8f8',
    marginHorizontal: -16, // Extend to edges if parent has padding
    marginBottom: 16,
  },
  iosInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iosInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  iosButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  iosButton: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginBottom: 10,
    minWidth: 150,
  },
  backButton: {
    minWidth: 150,
  },
  webModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'flex-start', // Position at top for better keyboard handling
    alignItems: 'center', 
    paddingTop: 80, // Add padding to position below status bar
  },
  webModalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '85%',
    maxWidth: 450,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  webModalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 40,
  },
  webModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  webCloseButton: {
    padding: 8,
  },
  webCloseButtonText: {
    fontSize: 18,
  },
  editNameContent: {
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'web' ? 20 : 0,
  },
  editNameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: Platform.OS === 'web' ? 44 : 40,
    ...(Platform.OS === 'web' && {
      outlineWidth: 0,
      outlineColor: 'transparent',
      outlineStyle: 'none',
    }),
  },
  editNameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: Platform.OS === 'web' ? 10 : 0,
  },
  editNameButton: {
    flex: 1,
  },
  foodBrandSelectorContent: {
    width: '100%',
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  foodBrandOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    width: '100%',
    minHeight: 72,
  },
  foodBrandOptionContent: {
    flex: 1,
    marginRight: 16,
  },
  foodBrandOptionName: {
    fontSize: 17,
    color: '#000',
    marginBottom: 4,
  },
  foodBrandOptionDetails: {
    fontSize: 13,
    color: '#666',
  },
  foodBrandCancelButton: {
    marginTop: 16,
  },
  foodBrandModal: {
    zIndex: 2000,
    elevation: 10,
    maxHeight: '85%',
    maxWidth: 450,
    width: '95%',
    position: Platform.OS === 'web' ? 'relative' : 'absolute',
    alignSelf: 'center',
  },
  modalOverlayFull: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileWebModal: {
    width: '95%',
    maxWidth: '95%',
    marginTop: 20,
    maxHeight: '80%',
    position: 'relative',
    top: 0,
    paddingBottom: 20,
  },
  webFeedAmountContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webInputGroup: {
    marginBottom: 20,
  },
  webInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  webInputLabel: {
    width: 80,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  webInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  webInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    paddingVertical: 8,
    color: '#333',
  },
  webInputUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    minWidth: 40,
  },
  webButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 8,
  },
  webButton: {
    flex: 1,
  },
});

export default React.memo(Scheduler);