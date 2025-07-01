import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDemo } from '../../contexts/DemoProvider';
import { ScheduleData } from '../feeders/types';
import { 
  fetchUserFeeders, 
  createFeeder as apiCreateFeeder,
  fetchFoodBrands as apiFetchFoodBrands,
  deleteFeeder as apiDeleteFeeder,
  updateFeederName as apiUpdateFeederName,
  assignHardwareId as apiAssignHardwareId
} from '../feeders/api';
import { 
  fetchAllCats,
  createCat as apiCreateCat,
  updateCat as apiUpdateCat,
  disassociateCat as apiDisassociateCat
} from '../cats/api';
import { useAuth } from '../../contexts/AuthProvider';

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
  
  const refetch = useCallback(async () => {
    // In demo mode, no need to refetch since data is local
    return Promise.resolve();
  }, []);
  
  return {
    cats: demoCats,
    loading: false,
    refetch
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
  
  const update = useCallback(async (catid: number, updates: any, skipAlert?: boolean) => {
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
  
  const assign = useCallback(async (feederId: number, hardwareId: string) => {
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
  
  return { assign, loading };
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchProfile = useCallback(async () => {
    // In demo mode, just return the demo profile
    return demoProfile;
  }, []);
  
  const updateUsername = useCallback(async (newUsername: string) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // In demo mode, just return success
      return true;
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    profile: demoProfile,
    loading,
    error,
    fetchProfile,
    updateUsername
  };
};

export const useDemoProfileEditor = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  
  const startEditing = useCallback((username?: string) => {
    setIsEditing(true);
    if (username) {
      setEditedUsername(username);
    }
  }, []);
  
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditedUsername('');
  }, []);
  
  return { 
    isEditing,
    editedUsername,
    setEditedUsername,
    startEditing,
    cancelEditing
  };
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

// Demo cat details hook
export const useDemoCatDetails = (catId: string | number) => {
  const { demoCats } = useDemo();
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState<any>(null);
  
  // Find cat in demo data
  useEffect(() => {
    setLoading(true);
    const numericCatId = typeof catId === 'string' ? parseInt(catId, 10) : catId;
    const foundCat = demoCats.find(c => c.catid === numericCatId);
    setCat(foundCat || null);
    setLoading(false);
  }, [catId, demoCats]);
  
  return { cat, loading };
};

// Demo disassociate cat hook
export const useDemoDisassociateCat = () => {
  const { deleteDemoCat } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const disassociateCat = useCallback(async (catId: number) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      deleteDemoCat(catId);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteDemoCat]);
  
  return { disassociateCat, loading };
};

// Demo feeder update hooks
export const useDemoUpdateFeederName = () => {
  const { updateDemoFeeder } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const updateName = useCallback(async (feederId: number, newName: string) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateDemoFeeder(feederId, { name: newName });
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateDemoFeeder]);
  
  return { updateName, loading };
};

export const useDemoUpdateFeederFeedAmount = () => {
  const { updateDemoFeeder } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const updateFeedAmount = useCallback(async (feederId: number, feedAmount: number) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Demo feeders don't have manual_feed_calories, so we'll just return success
      // In a real implementation, you might want to add this property to DemoFeeder
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateDemoFeeder]);
  
  return { updateFeedAmount, loading };
};

export const useDemoUpdateFeederFoodBrand = () => {
  const { updateDemoFeeder } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const updateFoodBrand = useCallback(async (feederId: number, foodBrand: string) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateDemoFeeder(feederId, { foodbrand: foodBrand });
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateDemoFeeder]);
  
  return { updateFoodBrand, loading };
};

// Demo available feeders hook
export const useDemoAvailableFeeders = () => {
  const { demoFeeders, demoCats } = useDemo();
  
  // Get feeders that are not assigned to any cats
  const availableFeeders = useMemo(() => {
    const assignedFeederIds = demoCats
      .map(cat => cat.feederid)
      .filter(id => id !== null);
    
    return demoFeeders.filter(feeder => !assignedFeederIds.includes(feeder.id));
  }, [demoFeeders, demoCats]);
  
  const refetch = useCallback(async () => {
    // In demo mode, no need to refetch since data is local
    return Promise.resolve();
  }, []);
  
  return {
    availableFeeders,
    loading: false,
    error: null,
    refetch
  };
};

// Demo unassign cats from feeder hook
export const useDemoUnassignCatsFromFeeder = () => {
  const { updateDemoCat } = useDemo();
  const [loading, setLoading] = useState(false);
  
  const unassignCats = useCallback(async (feederId: number) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In demo mode, we would need to update all cats that have this feeder
      // For now, just return success
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateDemoCat]);
  
  return { unassignCats, loading };
};

// Demo feed now hook
export const useDemoFeedNow = () => {
  const [loading, setLoading] = useState(false);
  
  const triggerFeedNow = useCallback(async (feederId: number, calories: number) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In demo mode, just return success
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { triggerFeedNow, loading };
};

// Demo fetch all cats hook
export const useDemoFetchAllCats = () => {
  const { demoCats } = useDemo();
  
  const fetchAllCats = useCallback(async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return demo cats
    return demoCats;
  }, [demoCats]);
  
  return { fetchAllCats };
}; 