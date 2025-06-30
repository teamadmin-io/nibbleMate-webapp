import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  fetchUserFeeders, 
  createFeeder as apiCreateFeeder,
  linkFeeder as apiLinkFeeder,
  fetchFeederSchedule,
  saveFeederSchedule,
  triggerFeedNow,
  fetchAvailableFeeders,
  assignHardwareId as apiAssignHardwareId,
  updateFeederName,
  fetchFoodBrands,
  deleteFeeder as apiDeleteFeeder,
  unassignCatsFromFeeder as apiUnassignCatsFromFeeder,
  updateFeederFeedAmount,
  updateFeederFoodBrand as apiUpdateFeederFoodBrand
} from './api';
import { Feeder, ScheduleData, FoodBrand } from './types';
import { safeApiCall } from '../../helpers/errors';
import { useAuth } from '../../contexts/AuthProvider';
import { API_URL } from '../../../constants';

/**
 * Hook for managing feeders with loading state
 */
export const useFeeders = () => {
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session, refreshSession } = useAuth();
  
  const fetchFeeders = useCallback(async () => {
    if (!session) {
      setFeeders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/feeders`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching feeders: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add debug logging
      console.log('🔍 DEBUG - Feeders data received:', data);
      
      // Log each feeder's brand information
      if (Array.isArray(data)) {
        data.forEach((feeder, index) => {
          console.log(`🔍 DEBUG - Feeder ${index + 1} (ID: ${feeder.id}) brand data:`, {
            brandname: feeder.brandname,
            foodbrand: feeder.foodbrand,
            foodBrandDetails: feeder.foodBrandDetails
          });
        });
      }
      
      setFeeders(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching feeders:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // If we get a 401, try to refresh the token
      if (err instanceof Error && err.message.includes('401')) {
        try {
          const refreshed = await refreshSession();
          if (refreshed) {
            // Try again with the new token
            fetchFeeders();
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session, refreshSession]);
  
  useEffect(() => {
    fetchFeeders();
  }, [fetchFeeders]);
  
  return { 
    feeders, 
    loading, 
    error,
    refetch: fetchFeeders
  };
};

/**
 * Hook for creating a new feeder
 */
export const useCreateFeeder = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const create = async (foodBrand: string, skipAlert: boolean = false, suggestedName?: string) => {
    setLoading(true);
    
    const result = await safeApiCall(
      () => apiCreateFeeder(foodBrand, suggestedName),
      'Failed to create feeder',
      !skipAlert // Only show API error alerts if not skipped
    );
    
    setLoading(false);
    
    if (result.success) {
      // Only show alert if not skipped (web clients will use the custom modal)
      if (!skipAlert) {
        Alert.alert('Success', 'Feeder created and linked to your account!', [
          { text: 'OK', onPress: () => router.push('/screens/MainPage') }
        ]);
      }
      return true;
    } else if (result.error) {
      // If there's an error in API call, we need to pass it up to the caller
      throw result.error;
    }
    
    return false;
  };
  
  return { create, loading };
};

/**
 * Hook for linking an existing feeder
 */
export const useLinkFeeder = () => {
  const [loading, setLoading] = useState(false);
  
  const link = async (feederId: number, hardwareId?: string) => {
    setLoading(true);
    
    const result = await safeApiCall(
      () => apiLinkFeeder(feederId, hardwareId),
      'Failed to link feeder'
    );
    
    setLoading(false);
    return result.success;
  };
  
  return { link, loading };
};

/**
 * Hook for managing a feeder's schedule
 */
export const useFeederSchedule = (feederId: string | number) => {
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [quantity, setQuantity] = useState<number>(100.0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  
  // Initialize schedule with default structure
  const initializeDefaultSchedule = () => {
    return {
      schedule: {
        Mon: [],
        Tue: [],
        Wed: [],
        Thu: [],
        Fri: [],
        Sat: [],
        Sun: []
      },
      manualFeedCalories: 20,
      feedingTimes: 0,
      lastUpdated: new Date().toISOString()
    };
  };
  
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await safeApiCall(
        async () => await fetchFeederSchedule(feederId),
        'fetch schedule'
      );

      if (result.success && result.data) {
        setScheduleId(result.data.scheduleId);
        setScheduleData(result.data.scheduleData);
        setQuantity(result.data.quantity || 100.0);
        setError(null);
      } else if (result.error) {
        console.error('Unable to fetch schedule from server, using mock data instead');
        // Create mock data when API fails
        setScheduleId(null);
        setScheduleData(initializeDefaultSchedule());
        setQuantity(100.0);
        setError(result.error);
      }
    } catch (e) {
      console.error('Error in useFeederSchedule, using mock data:', e);
      // Create mock data when API fails
      setScheduleId(null);
      setScheduleData(initializeDefaultSchedule());
      setQuantity(100.0);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [feederId]);
  
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);
  
  const saveSchedule = useCallback(async (newScheduleData: ScheduleData, skipAlert?: boolean, newQuantity?: number) => {
    setSaving(true);
    try {
      const saveQuantity = newQuantity !== undefined ? newQuantity : quantity;
      const result = await safeApiCall(
        async () => await saveFeederSchedule(feederId, scheduleId, newScheduleData, saveQuantity),
        'save schedule',
        !skipAlert
      );

      if (result.success && result.data) {
        setScheduleId(result.data);
        setScheduleData(newScheduleData);
        if (newQuantity !== undefined) {
          setQuantity(newQuantity);
        }
        setError(null);
        return result.data;
      } else if (result.error) {
        setError(result.error);
        throw result.error;
      }
      return null;
    } catch (e) {
      console.error('Error in useFeederSchedule.saveSchedule:', e);
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    } finally {
      setSaving(false);
    }
  }, [feederId, scheduleId, quantity]);
  
  const feedNow = useCallback(async (skipAlert?: boolean, calories?: number) => {
    setSaving(true);
    try {
      const result = await safeApiCall(
        async () => await triggerFeedNow(feederId, calories),
        'feed now',
        !skipAlert
      );
      setSaving(false);
      return result.success;
    } catch (e) {
      console.error('Error in useFeederSchedule.feedNow:', e);
      setError(e instanceof Error ? e : new Error(String(e)));
      setSaving(false);
      return false;
    }
  }, [feederId]);
  
  // Function to set the schedule data (used for client-side updates)
  const setSchedule = useCallback((newScheduleOrUpdater: ScheduleData | ((prev: ScheduleData | null) => ScheduleData | null)) => {
    setScheduleData(newScheduleOrUpdater);
  }, []);
  
  return {
    scheduleId,
    scheduleData,
    schedule: scheduleData, // Alias for backward compatibility
    quantity,
    loading,
    saving,
    error,
    fetchSchedule,
    saveSchedule,
    feedNow,
    setSchedule,
  };
};

/**
 * Hook for fetching available feeders without hardware IDs
 */
export const useAvailableFeeders = () => {
  const [availableFeeders, setAvailableFeeders] = useState<Feeder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await safeApiCall(
      () => fetchAvailableFeeders(),
      'Failed to load available feeders'
    );
    
    if (result.success && result.data) {
      setAvailableFeeders(result.data);
    } else if (result.error) {
      setError(result.error);
    }
    
    setLoading(false);
  }, []);
  
  useEffect(() => {
    fetchAvailable();
  }, [fetchAvailable]);
  
  return { 
    availableFeeders, 
    loading, 
    error,
    refetch: fetchAvailable
  };
};

/**
 * Hook for assigning hardware ID to feeder
 */
export const useAssignHardwareId = () => {
  const [loading, setLoading] = useState(false);
  
  const assign = async (feederId: number, hardwareId: string) => {
    console.log(`Attempting to assign hardware ID ${hardwareId} to feeder ${feederId}`);
    setLoading(true);
    
    const result = await safeApiCall(
      () => apiAssignHardwareId(feederId, hardwareId),
      'Failed to assign hardware ID',
      false // Don't show alert, component will handle it
    );
    
    if (result.success) {
      console.log('Hardware ID assignment successful');
      // Component will handle success feedback
    } else {
      console.log('Hardware ID assignment failed:', result.error);
    }
    
    setLoading(false);
    return result.success;
  };
  
  return { assign, loading };
};

/**
 * Hook for updating a feeder's name
 */
export const useUpdateFeederName = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const updateName = async (feederId: number, name: string, onSuccess?: () => void, skipAlert: boolean = false) => {
    setLoading(true);
    
    const result = await safeApiCall(
      () => updateFeederName(feederId, name),
      'Failed to update feeder name',
      !skipAlert // Only show API error alerts if not skipped
    );
    
    if (result.success) {
      // Only show success alert if not skipped
      if (!skipAlert) {
        Alert.alert('Success', 'Feeder name updated successfully!');
      }
      
      // Call the optional onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    }
    
    setLoading(false);
    return result.success;
  };
  
  return { updateName, loading };
};

/**
 * Hook for deleting a feeder
 */
export const useDeleteFeeder = () => {
  const [loading, setLoading] = useState(false);
  
  const deleteFeeder = async (feederId: number): Promise<boolean> => {
    setLoading(true);
    
    const result = await safeApiCall(
      () => apiDeleteFeeder(feederId),
      'Failed to delete feeder'
    );
    
    setLoading(false);
    return result.success;
  };
  
  return { deleteFeeder, loading };
};

/**
 * Hook for fetching food brands
 */
export const useFoodBrands = () => {
  const [foodBrands, setFoodBrands] = useState<FoodBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await safeApiCall(
      () => fetchFoodBrands(),
      'Failed to load food brands',
      false // Don't show alert
    );
    
    if (result.success && result.data) {
      setFoodBrands(result.data);
    } else if (result.error) {
      setError(result.error);
    }
    
    setLoading(false);
  }, []);
  
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);
  
  return { 
    foodBrands, 
    loading, 
    error,
    refetch: fetchBrands
  };
};

/**
 * Hook for unassigning cats from a feeder
 */
export const useUnassignCatsFromFeeder = () => {
  const [loading, setLoading] = useState(false);
  
  const unassignCats = async (feederId: number): Promise<{ success: boolean, cats?: Array<{ catid: number, catname: string }> }> => {
    setLoading(true);
    
    try {
      const result = await apiUnassignCatsFromFeeder(feederId);
      setLoading(false);
      return { success: true, cats: result.cats };
    } catch (error) {
      console.error('Error unassigning cats:', error);
      setLoading(false);
      return { success: false };
    }
  };
  
  return { unassignCats, loading };
};

/**
 * Hook for updating a feeder's feed amount
 */
export const useUpdateFeederFeedAmount = () => {
  const [loading, setLoading] = useState(false);
  
  const updateFeedAmount = async (feederId: number, calories: number, skipAlert: boolean = false) => {
    setLoading(true);
    
    const result = await safeApiCall(
      () => updateFeederFeedAmount(feederId, calories),
      'Failed to update feed amount',
      !skipAlert // Only show API error alerts if not skipped
    );
    
    if (result.success) {
      // Only show success alert if not skipped
      if (!skipAlert) {
        Alert.alert('Success', 'Feed amount updated successfully!');
      }
    }
    
    setLoading(false);
    return result.success;
  };
  
  return { updateFeedAmount, loading };
};

/**
 * Hook for updating a feeder's food brand
 */
export const useUpdateFeederFoodBrand = () => {
  const [loading, setLoading] = useState(false);
  
  const updateFoodBrand = async (feederId: number, brandName: string, skipAlert: boolean = false) => {
    setLoading(true);
    
    const result = await safeApiCall(
      () => apiUpdateFeederFoodBrand(feederId, brandName),
      'Failed to update food brand',
      !skipAlert // Only show API error alerts if not skipped
    );
    
    if (result.success) {
      // Only show success alert if not skipped
      if (!skipAlert) {
        Alert.alert('Success', 'Food brand updated successfully!');
      }
    }
    
    setLoading(false);
    return result.success;
  };
  
  return { updateFoodBrand, loading };
};