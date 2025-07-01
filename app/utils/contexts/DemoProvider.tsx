import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  updateDemoFeeder: (feederid: number, updates: Partial<DemoFeeder>) => void;
  deleteDemoCat: (catid: number) => void;
  linkCatToFeeder: (catid: number, feederid: number) => void;
  unlinkCatFromFeeder: (catid: number) => void;
  deleteDemoFeeder: (feederid: number) => void;
  resetDemoData: () => void;
  canAddFeeder: boolean;
  canAddCat: boolean;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

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

  // Demo mode is now purely in-memory - no persistence
  // This eliminates all SecureStore issues

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setDemoFeeders(initialDemoFeeders);
    setDemoCats(initialDemoCats);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoFeeders([]);
    setDemoCats([]);
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
    return true;
  };

  const updateDemoCat = (catid: number, updates: Partial<DemoCat>) => {
    const updatedCats = demoCats.map(cat => 
      cat.catid === catid ? { ...cat, ...updates } : cat
    );
    setDemoCats(updatedCats);
  };

  const updateDemoFeeder = (feederid: number, updates: Partial<DemoFeeder>) => {
    const updatedFeeders = demoFeeders.map(feeder => 
      feeder.id === feederid ? { ...feeder, ...updates } : feeder
    );
    setDemoFeeders(updatedFeeders);
  };

  const deleteDemoCat = (catid: number) => {
    const updatedCats = demoCats.filter(cat => cat.catid !== catid);
    setDemoCats(updatedCats);
  };

  const linkCatToFeeder = (catid: number, feederid: number) => {
    const updatedCats = demoCats.map(cat => 
      cat.catid === catid ? { ...cat, feederid } : cat
    );
    setDemoCats(updatedCats);
  };

  const unlinkCatFromFeeder = (catid: number) => {
    const updatedCats = demoCats.map(cat => 
      cat.catid === catid ? { ...cat, feederid: null } : cat
    );
    setDemoCats(updatedCats);
  };

  const deleteDemoFeeder = (feederid: number) => {
    const updatedFeeders = demoFeeders.filter(feeder => feeder.id !== feederid);
    const updatedCats = demoCats.map(cat => 
      cat.feederid === feederid ? { ...cat, feederid: null } : cat
    );
    setDemoFeeders(updatedFeeders);
    setDemoCats(updatedCats);
  };

  const resetDemoData = () => {
    setDemoFeeders(initialDemoFeeders);
    setDemoCats(initialDemoCats);
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
    updateDemoFeeder,
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