import { useDemo } from '../../contexts/DemoProvider';
import { useState, useCallback } from 'react';

// Import real hooks
import { useFeeders, useFoodBrands, useCreateFeeder, useFeederSchedule } from '../feeders/hooks';
import { useCats, useCreateCat, useUpdateCat, useCatDetails, useDisassociateCat } from '../cats/hooks';
import { useSignIn, useSignOut, useProfile, useProfileEditor } from '../auth/hooks';
import { useAssignHardwareId, useDeleteFeeder, useUpdateFeederName, useUpdateFeederFeedAmount, useUpdateFeederFoodBrand, useAvailableFeeders, useUnassignCatsFromFeeder } from '../feeders/hooks';
import { triggerFeedNow } from '../feeders/api';
import { fetchAllCats } from '../cats/api';

// Import demo hooks
import {
  useDemoFeeders,
  useDemoFoodBrands,
  useDemoCreateFeeder,
  useDemoCats,
  useDemoCreateCat,
  useDemoUpdateCat,
  useDemoDeleteCat,
  useDemoSignIn,
  useDemoSignOut,
  useDemoProfile,
  useDemoProfileEditor,
  useDemoAssignHardwareId,
  useDemoDeleteFeeder,
  useDemoFeederSchedule,
  useDemoCatDetails,
  useDemoDisassociateCat,
  useDemoUpdateFeederName,
  useDemoUpdateFeederFeedAmount,
  useDemoUpdateFeederFoodBrand,
  useDemoAvailableFeeders,
  useDemoUnassignCatsFromFeeder,
  useDemoFeedNow,
  useDemoFetchAllCats
} from './hooks';

// Hook selector functions
export const useFeedersSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoFeeders() : useFeeders();
};

export const useFoodBrandsSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoFoodBrands() : useFoodBrands();
};

export const useCreateFeederSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoCreateFeeder() : useCreateFeeder();
};

export const useCatsSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoCats() : useCats();
};

export const useCreateCatSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoCreateCat() : useCreateCat();
};

export const useUpdateCatSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoUpdateCat() : useUpdateCat();
};

// Note: No real delete cat hook exists, so we only provide demo version
export const useDeleteCatSelector = () => {
  const { isDemoMode } = useDemo();
  if (!isDemoMode) {
    throw new Error('Delete cat functionality not available in production mode');
  }
  return useDemoDeleteCat();
};

export const useSignInSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoSignIn() : useSignIn();
};

export const useSignOutSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoSignOut() : useSignOut();
};

export const useProfileSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoProfile() : useProfile();
};

export const useProfileEditorSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoProfileEditor() : useProfileEditor();
};

export const useAssignHardwareIdSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoAssignHardwareId() : useAssignHardwareId();
};

export const useDeleteFeederSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoDeleteFeeder() : useDeleteFeeder();
};

export const useFeederScheduleSelector = (feederId: string | number) => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoFeederSchedule(feederId) : useFeederSchedule(feederId);
};

export const useCatDetailsSelector = (catid: string | number) => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoCatDetails(catid) : useCatDetails(catid);
};

export const useDisassociateCatSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoDisassociateCat() : useDisassociateCat();
};

export const useUpdateFeederNameSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoUpdateFeederName() : useUpdateFeederName();
};

export const useUpdateFeederFeedAmountSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoUpdateFeederFeedAmount() : useUpdateFeederFeedAmount();
};

export const useUpdateFeederFoodBrandSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoUpdateFeederFoodBrand() : useUpdateFeederFoodBrand();
};

export const useAvailableFeedersSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoAvailableFeeders() : useAvailableFeeders();
};

export const useUnassignCatsFromFeederSelector = () => {
  const { isDemoMode } = useDemo();
  return isDemoMode ? useDemoUnassignCatsFromFeeder() : useUnassignCatsFromFeeder();
};

export const useFeedNowSelector = () => {
  const { isDemoMode } = useDemo();
  if (isDemoMode) {
    return useDemoFeedNow();
  } else {
    // For real mode, we need to create a hook-like interface
    const [loading, setLoading] = useState(false);
    
    const triggerFeedNowWrapper = useCallback(async (feederId: number, calories: number) => {
      setLoading(true);
      try {
        const result = await triggerFeedNow(feederId, calories);
        return result;
      } finally {
        setLoading(false);
      }
    }, []);
    
    return { triggerFeedNow: triggerFeedNowWrapper, loading };
  }
};

export const useFetchAllCatsSelector = () => {
  const { isDemoMode } = useDemo();
  if (isDemoMode) {
    return useDemoFetchAllCats();
  } else {
    // For real mode, we need to create a hook-like interface
    const fetchAllCatsWrapper = useCallback(async () => {
      return await fetchAllCats();
    }, []);
    
    return { fetchAllCats: fetchAllCatsWrapper };
  }
}; 