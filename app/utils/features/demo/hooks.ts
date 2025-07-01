import { useState, useCallback } from 'react';
import { useDemo } from '../../contexts/DemoProvider';

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