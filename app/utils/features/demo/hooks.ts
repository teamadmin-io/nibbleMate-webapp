import React, { useState, useCallback } from 'react';
import { useDemo } from '../../contexts/DemoProvider';
import { ScheduleData } from '../feeders/types';

// Demo feeder hooks
export const useDemoFeeders = () => {
  const { demoFeeders, canAddFeeder } = useDemo();
  
  return {
    feeders: demoFeeders,
    loading: false,
    error: null,
    refetch: () => {},
    canAddFeeder
  };
};

export const useDemoFoodBrands = () => {
  const foodBrands = [
    'Purina',
    'Royal Canin',
    'Science Diet',
    'Iams',
    'Fancy Feast',
    'Friskies',
    'Whiskas',
    'Meow Mix'
  ];
  
  return {
    foodBrands,
    loading: false,
    error: null
  };
};

export const useDemoCreateFeeder = () => {
  const { addDemoFeeder } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const create = useCallback(async (foodbrand: string, skipAlert = false, name?: string) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = addDemoFeeder(name || `My ${foodbrand} Feeder`, foodbrand);
      
      if (!success) {
        throw new Error('Maximum number of demo feeders reached (4)');
      }
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addDemoFeeder]);
  
  return { create, loading };
};

// Demo cat hooks
export const useDemoCats = () => {
  const { demoCats } = useDemo();
  
  return {
    cats: demoCats,
    loading: false,
    error: null,
    refetch: () => {}
  };
};

export const useDemoCreateCat = () => {
  const { addDemoCat } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const create = useCallback(async (catData: any, skipAlert = false) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = addDemoCat(catData);
      
      if (!success) {
        throw new Error('Maximum number of demo cats reached (4)');
      }
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addDemoCat]);
  
  return { create, loading };
};

export const useDemoUpdateCat = () => {
  const { updateDemoCat } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const update = useCallback(async (catid: number, updates: any) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateDemoCat(catid, updates);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateDemoCat]);
  
  return { update, loading };
};

export const useDemoDeleteCat = () => {
  const { deleteDemoCat } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const deleteCat = useCallback(async (catid: number) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      deleteDemoCat(catid);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteDemoCat]);
  
  return { deleteCat, loading };
};

// Demo feeder management hooks
export const useDemoAssignHardwareId = () => {
  const [loading, setLoading] = useState(false);
  
  const assignHardwareId = useCallback(async (feederId: number, hardwareId: string) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In demo mode, we just validate the format
      if (!/^\d{12}$/.test(hardwareId.replace(/[-\s]/g, ''))) {
        throw new Error('Hardware ID must be 12 digits');
      }
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { assignHardwareId, loading };
};

export const useDemoDeleteFeeder = () => {
  const { deleteDemoFeeder } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const deleteFeeder = useCallback(async (feederId: number) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      deleteDemoFeeder(feederId);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteDemoFeeder]);
  
  return { deleteFeeder, loading };
};

// Demo auth hooks
export const useDemoSignIn = () => {
  const [loading, setLoading] = useState(false);
  
  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In demo mode, always succeed
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { signIn, loading };
};

export const useDemoSignOut = () => {
  const { exitDemoMode } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      exitDemoMode();
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [exitDemoMode]);
  
  return { signOut, loading };
};

// Demo profile hooks
export const useDemoProfile = () => {
  const demoProfile = {
    id: 'demo-user',
    email: 'demo@nibblemate.com',
    username: 'Demo User',
    created_at: new Date().toISOString()
  };
  
  return {
    profile: demoProfile,
    loading: false,
    error: null
  };
};

export const useDemoProfileEditor = () => {
  const [loading, setLoading] = useState(false);
  
  const updateProfile = useCallback(async (updates: any) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In demo mode, just return success
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { updateProfile, loading };
};

// Demo feeder schedule hook
export const useDemoFeederSchedule = (feederId: string | number) => {
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [quantity, setQuantity] = useState<number>(100.0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize schedule with default structure
  const initializeDefaultSchedule = (): ScheduleData => ({
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
  });

  // Load schedule - in demo mode, just use default for now
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For demo mode, just use default schedule
      // In a real implementation, you could store this in the demo context
      setScheduleId(null);
      setScheduleData(initializeDefaultSchedule());
      setQuantity(100.0);
    } catch (e) {
      setScheduleId(null);
      setScheduleData(initializeDefaultSchedule());
      setQuantity(100.0);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [feederId]);

  // Save schedule - in demo mode, just update local state
  const saveSchedule = useCallback(async (newScheduleData: ScheduleData, skipAlert?: boolean, newQuantity?: number) => {
    setSaving(true);
    try {
      const saveQuantity = newQuantity !== undefined ? newQuantity : quantity;
      const newId = scheduleId || Date.now();
      
      // In demo mode, just update local state
      setScheduleId(newId);
      setScheduleData(newScheduleData);
      setQuantity(saveQuantity);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return newId;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    } finally {
      setSaving(false);
    }
  }, [feederId, scheduleId, quantity]);

  // Simulate feed now (no-op in demo)
  const feedNow = useCallback(async (skipAlert?: boolean, calories?: number) => {
    setSaving(true);
    try {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaving(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setSaving(false);
      return false;
    }
  }, []);

  // Function to set the schedule data (used for client-side updates)
  const setSchedule = useCallback((newScheduleOrUpdater: ScheduleData | ((prev: ScheduleData | null) => ScheduleData | null)) => {
    setScheduleData(newScheduleOrUpdater);
  }, []);

  // Fetch on mount/feederId change
  React.useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    scheduleId,
    scheduleData,
    schedule: scheduleData, // Alias for compatibility
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