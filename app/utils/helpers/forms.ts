import { useState } from 'react';

/**
 * Generic form handler for any form data type
 */
export function useForm<T>(initialValues: T) {
  const [formData, setFormData] = useState<T>(initialValues);
  
  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const resetForm = () => {
    setFormData(initialValues);
  };
  
  return {
    formData,
    updateField,
    resetForm,
    setFormData
  };
}