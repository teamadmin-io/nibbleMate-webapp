import { useDemo } from '../../contexts/DemoProvider';

// Import real hooks
import { useFeeders, useFoodBrands, useCreateFeeder } from '../feeders/hooks';
import { useCats, useCreateCat, useUpdateCat } from '../cats/hooks';
import { useSignIn, useSignOut, useProfile, useProfileEditor } from '../auth/hooks';
import { useAssignHardwareId, useDeleteFeeder } from '../feeders/hooks';

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
  useDemoDeleteFeeder
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