import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchAllCats,
  fetchCatById,
  fetchCatHistory,
  createCat as apiCreateCat,
  updateCat as apiUpdateCat,
  disassociateCat as apiDisassociateCat
} from './api';
import { WeightRecord, FeedRecord, DataPeriod, DataType, Cat } from './types';
import { debugLog } from '../../debugging';

// Enable detailed debugging
const DEBUG_ENABLED = true;
const DEBUG_PREFIX = '🐱';

// Debug logger for cats module
const catDebugLog = (hookName: string, action: string, data?: any, error?: Error, startTime?: number) => {
  if (!DEBUG_ENABLED) return;
  console.log(`${DEBUG_PREFIX} ${hookName}`, action, data, error, startTime ? `Time: ${Date.now() - startTime}ms` : '');
};

// Get all cats
export const useCats = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCats();
      setCats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching cats:', error);
      // Ensure cats is always at least an empty array, never null or undefined
      setCats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { cats, loading, refetch };
};

// Get details for a single cat
export const useCatDetails = (catid: string | number) => {
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCat = async () => {
      setLoading(true);
      try {
        const data = await fetchCatById(catid);
        if (isMounted) setCat(data);
      } catch {
        if (isMounted) setCat(null);
      }
      if (isMounted) setLoading(false);
    };
    if (catid) fetchCat();
    return () => {
      isMounted = false;
    };
  }, [catid]);

  return { cat, loading };
};

// Get weight/feed history for a cat
export const useCatHistory = (catId: string | number, initialPeriod: DataPeriod = 'week') => {
  const [period, setPeriod] = useState<DataPeriod>(initialPeriod);
  const [dataType, setDataType] = useState<DataType>('weight');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [weightData, setWeightData] = useState<WeightRecord[]>([]);
  const [feedData, setFeedData] = useState<FeedRecord[]>([]);

  // Add a cleanup flag to handle component unmounting
  const fetchData = useCallback(async () => {
    if (!catId) return;
    setLoading(true);
    setError(null);

    try {
      // Get all data at once using the unified endpoint
      const result = await fetchCatHistory(catId, period);
      
      // Update weight data if available
      if (result.weight && result.weight.data) {
        setWeightData(result.weight.data);
      } else {
        setWeightData([]);
      }
      
      // Update feed data if available (note the API returns "amount", not "feed")
      if (result.amount && result.amount.data) {
        setFeedData(result.amount.data);
      } else {
        setFeedData([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cat history:', err);
      setError(err instanceof Error ? err : new Error('Failed to load cat history'));
      setLoading(false);
    }
  }, [catId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get the appropriate data for the current dataType
  const historyData = useMemo(() => {
    return dataType === 'weight' ? weightData : feedData;
  }, [dataType, weightData, feedData]);

  return {
    historyData, // Used by HistoryChart
    data: historyData, // For backward compatibility
    dataType,
    setDataType,
    period,
    setPeriod,
    loading,
    error,
    refetch: fetchData
  };
};

// Create a new cat
export const useCreateCat = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const create = async (catData: any, skipAlert: boolean = false) => {
    console.log('useCreateCat hook received:', JSON.stringify(catData, null, 2));
    setLoading(true);
    try {
      const result = await apiCreateCat(catData);
      console.log('Cat created successfully:', JSON.stringify(result, null, 2));
      
      // Use platform-specific feedback
      if (!skipAlert) {
        if (Platform.OS === 'web') {
          // Web platforms should handle this with their own FeedbackModal implementation
          // The caller is responsible for showing feedback on web
        } else {
          // Native platforms use Alert directly
          Alert.alert('Success', 'Cat created successfully!', [
            { text: 'OK', onPress: () => router.push('/screens/CatPage') }
          ]);
        }
      }

      // Navigate regardless of alert/modal
      if (!skipAlert && Platform.OS !== 'web') {
        // Native platforms already handle navigation in the Alert callback
      } else {
        // Web or skipAlert case, navigate directly
        router.push('/screens/CatPage');
      }
      
      return result;
    } catch (error: any) {
      console.error('Error in useCreateCat:', error.message);
      
      if (!skipAlert && Platform.OS !== 'web') {
        // Only show native alert for native platforms
        Alert.alert('Error', error.message || 'Failed to create cat');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading };
};

// Update an existing cat
export const useUpdateCat = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = async (catid: string | number | null, catData: any, skipAlert: boolean = false) => {
    // Handle null or invalid catid explicitly
    if (catid === null || catid === undefined || (typeof catid === 'number' && isNaN(catid))) {
      console.error("useUpdateCat: Attempted to update with invalid catid:", catid);
      throw new Error('Invalid Cat ID provided for update.');
    }

    setLoading(true);
    try {
      await apiUpdateCat(catid, catData);
      
      // Use platform-specific feedback
      if (!skipAlert) {
        if (Platform.OS === 'web') {
          // Web platforms should handle this with their own FeedbackModal implementation
          // The caller is responsible for showing feedback on web
        } else {
          // Native platforms use Alert directly
          Alert.alert('Success', 'Cat updated successfully!', [
            { text: 'OK', onPress: () => router.push('/screens/CatPage') }
          ]);
        }
      }

      // Navigate only on native if not skipped
      if (!skipAlert && Platform.OS !== 'web') {
        // Native platforms already handle navigation in the Alert callback
      } else if (Platform.OS === 'web') {
        // Web should not navigate here - the component will handle it
        // This prevents flashing of the previous screen
      }
      
      return true;
    } catch (error: any) {
      if (!skipAlert && Platform.OS !== 'web') {
        // Only show native alert for native platforms
        Alert.alert('Error', error.message || 'Failed to update cat');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
};

// Disassociate a cat from the user's account
export const useDisassociateCat = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const disassociateCat = async (catid: string | number): Promise<boolean> => {
    setLoading(true);
    
    try {
      await apiDisassociateCat(catid);
      return true;
    } catch (error) {
      console.error('Error in useDisassociateCat:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return { disassociateCat, loading };
};