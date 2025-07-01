import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

// Demo data types
interface DemoFeeder {
  id: number;
  name: string;
  foodbrand: string;
  hardware_id: string | null;
  created_at: string;
}

interface DemoCat {
  catid: number;
  catname: string;
  catbreed: string;
  catage: number;
  catweight: number;
  catlength: number;
  catsex: string;
  feederid: number | null;
  microchip: string | null;
  created_at: string;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoFeeders: DemoFeeder[];
  demoCats: DemoCat[];
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  addDemoFeeder: (name: string, foodbrand: string) => boolean;
  addDemoCat: (catData: Omit<DemoCat, 'catid' | 'created_at'>) => boolean;
  updateDemoCat: (catid: number, updates: Partial<DemoCat>) => void;
  deleteDemoCat: (catid: number) => void;
  linkCatToFeeder: (catid: number, feederid: number) => void;
  unlinkCatFromFeeder: (catid: number) => void;
  deleteDemoFeeder: (feederid: number) => void;
  resetDemoData: () => void;
  canAddFeeder: boolean;
  canAddCat: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Demo storage keys
const DEMO_MODE_KEY = 'nibblemate_demo_mode';
const DEMO_FEEDERS_KEY = 'nibblemate_demo_feeders';
const DEMO_CATS_KEY = 'nibblemate_demo_cats';

// Demo limits
const MAX_DEMO_FEEDERS = 4;
const MAX_DEMO_CATS = 4;

// Initial demo data
const initialDemoFeeders: DemoFeeder[] = [
  {
    id: 1,
    name: "My Purina Feeder",
    foodbrand: "Purina",
    hardware_id: "DEMO123456789",
    created_at: new Date().toISOString()
  }
];

const initialDemoCats: DemoCat[] = [
  {
    catid: 1,
    catname: "Whiskers",
    catbreed: "Domestic Shorthair",
    catage: 3,
    catweight: 12.5,
    catlength: 45.0,
    catsex: "Male",
    feederid: 1,
    microchip: "DEMO987654321",
    created_at: new Date().toISOString()
  }
];

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoFeeders, setDemoFeeders] = useState<DemoFeeder[]>(initialDemoFeeders);
  const [demoCats, setDemoCats] = useState<DemoCat[]>(initialDemoCats);

  // Load demo state from storage
  useEffect(() => {
    const loadDemoState = async () => {
      try {
        const demoMode = await SecureStore.getItemAsync(DEMO_MODE_KEY);
        if (demoMode === 'true') {
          setIsDemoMode(true);
          
          // Load demo data
          const storedFeeders = await SecureStore.getItemAsync(DEMO_FEEDERS_KEY);
          const storedCats = await SecureStore.getItemAsync(DEMO_CATS_KEY);
          
          if (storedFeeders) {
            setDemoFeeders(JSON.parse(storedFeeders));
          }
          if (storedCats) {
            setDemoCats(JSON.parse(storedCats));
          }
        }
      } catch (error) {
        console.log('Demo: Error loading demo state:', error);
      }
    };
    
    loadDemoState();
  }, []);

  // Save demo state to storage
  const saveDemoState = async (mode: boolean, feeders?: DemoFeeder[], cats?: DemoCat[]) => {
    try {
      await SecureStore.setItemAsync(DEMO_MODE_KEY, mode.toString());
      if (feeders) {
        await SecureStore.setItemAsync(DEMO_FEEDERS_KEY, JSON.stringify(feeders));
      }
      if (cats) {
        await SecureStore.setItemAsync(DEMO_CATS_KEY, JSON.stringify(cats));
      }
    } catch (error) {
      console.log('Demo: Error saving demo state:', error);
    }
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setDemoFeeders(initialDemoFeeders);
    setDemoCats(initialDemoCats);
    saveDemoState(true, initialDemoFeeders, initialDemoCats);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoFeeders([]);
    setDemoCats([]);
    saveDemoState(false, [], []);
  };

  const addDemoFeeder = (name: string, foodbrand: string): boolean => {
    if (demoFeeders.length >= MAX_DEMO_FEEDERS) {
      return false;
    }

    const newFeeder: DemoFeeder = {
      id: Math.max(...demoFeeders.map(f => f.id), 0) + 1,
      name,
      foodbrand,
      hardware_id: `DEMO${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      created_at: new Date().toISOString()
    };

    const updatedFeeders = [...demoFeeders, newFeeder];
    setDemoFeeders(updatedFeeders);
    saveDemoState(true, updatedFeeders, demoCats);
    return true;
  };

  const addDemoCat = (catData: Omit<DemoCat, 'catid' | 'created_at'>): boolean => {
    if (demoCats.length >= MAX_DEMO_CATS) {
      return false;
    }

    const newCat: DemoCat = {
      ...catData,
      catid: Math.max(...demoCats.map(c => c.catid), 0) + 1,
      created_at: new Date().toISOString()
    };

    const updatedCats = [...demoCats, newCat];
    setDemoCats(updatedCats);
    saveDemoState(true, demoFeeders, updatedCats);
    return true;
  };

  const updateDemoCat = (catid: number, updates: Partial<DemoCat>) => {
    const updatedCats = demoCats.map(cat => 
      cat.catid === catid ? { ...cat, ...updates } : cat
    );
    setDemoCats(updatedCats);
    saveDemoState(true, demoFeeders, updatedCats);
  };

  const deleteDemoCat = (catid: number) => {
    const updatedCats = demoCats.filter(cat => cat.catid !== catid);
    setDemoCats(updatedCats);
    saveDemoState(true, demoFeeders, updatedCats);
  };

  const linkCatToFeeder = (catid: number, feederid: number) => {
    const updatedCats = demoCats.map(cat => 
      cat.catid === catid ? { ...cat, feederid } : cat
    );
    setDemoCats(updatedCats);
    saveDemoState(true, demoFeeders, updatedCats);
  };

  const unlinkCatFromFeeder = (catid: number) => {
    const updatedCats = demoCats.map(cat => 
      cat.catid === catid ? { ...cat, feederid: null } : cat
    );
    setDemoCats(updatedCats);
    saveDemoState(true, demoFeeders, updatedCats);
  };

  const deleteDemoFeeder = (feederid: number) => {
    const updatedFeeders = demoFeeders.filter(feeder => feeder.id !== feederid);
    const updatedCats = demoCats.map(cat => 
      cat.feederid === feederid ? { ...cat, feederid: null } : cat
    );
    setDemoFeeders(updatedFeeders);
    setDemoCats(updatedCats);
    saveDemoState(true, updatedFeeders, updatedCats);
  };

  const resetDemoData = () => {
    setDemoFeeders(initialDemoFeeders);
    setDemoCats(initialDemoCats);
    saveDemoState(true, initialDemoFeeders, initialDemoCats);
  };

  const canAddFeeder = demoFeeders.length < MAX_DEMO_FEEDERS;
  const canAddCat = demoCats.length < MAX_DEMO_CATS;

  const value: DemoContextType = {
    isDemoMode,
    demoFeeders,
    demoCats,
    enterDemoMode,
    exitDemoMode,
    addDemoFeeder,
    addDemoCat,
    updateDemoCat,
    deleteDemoCat,
    linkCatToFeeder,
    unlinkCatFromFeeder,
    deleteDemoFeeder,
    resetDemoData,
    canAddFeeder,
    canAddCat
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}; 