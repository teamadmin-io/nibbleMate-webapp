import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Platform, useWindowDimensions, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GlobalStyles from '../../../assets/styles/GlobalStyles';
import Button from '../../components/Button';
import LoadingIndicator from '../../components/LoadingIndicator';
import FeedbackModal from '../../components/FeedbackModal';
import { showFeedback, ModalType } from '../../utils/helpers/feedbackHelpers';
import { useUpdateCatSelector, useFeedersSelector, useCatsSelector, useCatDetailsSelector, useDisassociateCatSelector } from '../../utils/features/demo/hookSelector';
import { CatFormData } from '../../utils/features/cats/types';
import { useForm } from '../../utils/helpers/forms';
import { getFeederDisplayName } from '../../utils/helpers/feederHelpers';

const EditCatPage = () => {
  const { catid } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [showIOSSexPicker, setShowIOSSexPicker] = useState(false);
  
  // State for responsive layout
  const [contentWidth, setContentWidth] = useState('100%');
  
  // Handle responsive width based on screen size
  useEffect(() => {
    if (width < 600) {
      // Mobile: full width with padding
      setContentWidth('100%');
    } else if (width < 1024) {
      // Tablet: 80% of screen width
      setContentWidth('80%');
    } else if (width < 1440) {
      // Desktop: 70% of screen width
      setContentWidth('70%');
    } else {
      // Large desktop: 60% of screen width
      setContentWidth('60%');
    }
  }, [width]);

  const processedCatId = Array.isArray(catid) ? catid[0] : catid;
  const numericCatId = processedCatId ? parseInt(processedCatId, 10) : null;
  const stringCatId = (numericCatId !== null && !isNaN(numericCatId)) ? String(numericCatId) : undefined;

  const { cat, loading: loadingCat } = useCatDetailsSelector(stringCatId!);
  const { update, loading: updating } = useUpdateCatSelector();
  const { disassociateCat, loading: deleting } = useDisassociateCatSelector();
  const { feeders = [], loading: loadingFeeders } = useFeedersSelector();
  const { cats = [], loading: loadingCats } = useCatsSelector();

  // Modal state (for web only)
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>(ModalType.SUCCESS);

  // Helper function to show feedback
  const handleShowFeedback = (title: string, message: string, type: ModalType) => {
    showFeedback(
      title, 
      message, 
      type, 
      setShowModal, 
      setModalTitle, 
      setModalMessage, 
      setModalType
    );
  };

  const { formData, updateField, setFormData, resetForm } = useForm<CatFormData>({
    catname: '',
    catbreed: '',
    catage: '',
    catweight: '',
    catlength: '',
    catsex: '',
    feederid: null,
    microchip: '',
  });

  // Calculate available feeders: Feeders not assigned OR assigned to this cat
  const availableFeeders = feeders.filter(f => {
    const assignedCat = cats.find(c => c.feederid === f.id);
    // Feeder is available if it's not assigned OR it's assigned to the current cat being edited
    return !assignedCat || (assignedCat && assignedCat.catid === numericCatId);
  });

  // Initialize form only once when cat data is loaded
  const initialized = useRef(false);
  useEffect(() => {
    // Only initialize if cat data exists, feeders are loaded, and not already initialized
    if (cat && !loadingFeeders && !initialized.current) {
      const initialFeederId = cat.feederid ?? (availableFeeders.length > 0 ? availableFeeders[0].id : null);
      
      setFormData({
        catname: cat.catname || '',
        catbreed: cat.catbreed || '',
        catage: cat.catage != null ? String(cat.catage) : '', // Ensure string conversion
        catweight: cat.catweight != null ? String(cat.catweight) : '', // Ensure string conversion
        catlength: cat.catlength != null ? String(cat.catlength) : '', // Ensure string conversion
        catsex: cat.catsex || '',
        feederid: cat.feederid,
        microchip: cat.microchip != null ? String(cat.microchip) : '', // Keep for data integrity, but don't expose to user
      });
      initialized.current = true;
    }
    // Dependency array includes cat, loadingFeeders, setFormData
  }, [cat, loadingFeeders, setFormData]);

  // Combined loading state: True if fetching cat, feeders, cats, or updating/deleting
  const loading = loadingCat || loadingFeeders || loadingCats || updating || deleting || !initialized.current;

  const handleUpdate = async () => {
    // --- Input Validation ---
    // Validate all required fields according to the database schema
    const requiredFields = [
      { key: 'catname' as keyof CatFormData, label: 'Name' },
      { key: 'catbreed' as keyof CatFormData, label: 'Breed' },
      { key: 'catsex' as keyof CatFormData, label: 'Sex' },
      { key: 'feederid' as keyof CatFormData, label: 'Feeder' }
    ];

    // Check for empty required fields
    for (const field of requiredFields) {
      if (!formData[field.key]) {
        handleShowFeedback('Error', `${field.label} is required`, ModalType.ERROR);
        return;
      }
    }
    
    // Prevent using reserved prefix in cat names
    if (formData.catname.startsWith('DISASSOCIATED:')) {
      handleShowFeedback('Error', 'This name prefix is reserved for system use', ModalType.ERROR);
      return;
    }
    
    // Validate numeric fields - these must have valid values as they're NOT NULL in the schema
    const numericFields = [
      { key: 'catage' as keyof CatFormData, label: 'Age' },
      { key: 'catweight' as keyof CatFormData, label: 'Weight' },
      { key: 'catlength' as keyof CatFormData, label: 'Length' }
    ];
    
    for (const field of numericFields) {
      if (!formData[field.key] || isNaN(Number(formData[field.key]))) {
        handleShowFeedback('Error', `Valid numeric value for ${field.label} is required`, ModalType.ERROR);
        return;
      }
    }

    // Remove microchip validation - hardware handled, not user

    if (numericCatId === null || isNaN(numericCatId)) {
      console.error("handleUpdate called with invalid numericCatId");
      handleShowFeedback('Error', 'Invalid Cat ID.', ModalType.ERROR);
      return;
    }

    try {
      // Convert string values to appropriate types
      // Preserve the original microchip value without modifying it
      const processedFormData = {
        ...formData,
        catage: Number(formData.catage),
        catweight: Number(formData.catweight),
        catlength: Number(formData.catlength),
        // Keep existing microchip value, don't override
        microchip: cat?.microchip,
      };
      
      // Skip native alerts in the update function since we'll handle them here consistently
      const skipAlert = true;
      await update(numericCatId!, processedFormData, skipAlert);

      // Show success feedback on all platforms
      if (Platform.OS === 'web') {
        // Web: Show success modal (navigation handled by dismiss)
        handleShowFeedback('Success', 'Cat updated successfully!', ModalType.SUCCESS);
      } else {
        // Native: Show alert with navigation callback
        Alert.alert(
          "Success",
          "Cat updated successfully!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }

    } catch (e: any) {
      // Show error feedback on all platforms
      const errorMessage = e.message || 'Failed to update cat. Please try again.';
      if (Platform.OS === 'web') {
        handleShowFeedback('Error', errorMessage, ModalType.ERROR);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleCancel = () => {
    router.back();
  };
  
  const handleModalDismiss = () => {
    setShowModal(false);
    if (modalType === ModalType.SUCCESS) {
      router.push('/screens/CatPage');
    }
  };

  // Handle cat deletion (disassociation)
  const handleRemoveCat = async () => {
    if (!cat) return;
    
    // Confirm the deletion
    if (Platform.OS === 'web') {
      if (!window.confirm(`Are you sure you want to remove cat "${cat.catname}" from your account? This action cannot be undone.`)) {
        return;
      }
    } else {
      return new Promise((resolve) => {
        Alert.alert(
          "Remove Cat",
          `Are you sure you want to remove cat "${cat.catname}" from your account? This action cannot be undone.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { 
              text: "Remove", 
              style: "destructive", 
              onPress: () => {
                resolve(true);
                performRemoval();
              }
            }
          ]
        );
      });
    }
    
    // If we're on web or if the alert was confirmed, proceed with removal
    if (Platform.OS === 'web') {
      performRemoval();
    }
  };
  
  // Function to actually perform the cat removal
  const performRemoval = async () => {
    if (!cat || !cat.catid) return;
    
    const success = await disassociateCat(cat.catid);
    
    if (success) {
      if (Platform.OS === 'web') {
        handleShowFeedback(
          'Success!',
          `Cat "${cat.catname}" has been removed from your account.`,
          ModalType.SUCCESS
        );
        // Navigation will happen via the modal dismiss handler
      } else {
        // For native platforms, show an alert and then navigate
        Alert.alert(
          "Success!",
          `Cat "${cat.catname}" has been removed from your account.`,
          [
            { 
              text: "OK", 
              onPress: () => router.push('/screens/CatPage') 
            }
          ]
        );
      }
    } else {
      // Handle error
      const errorMessage = "Failed to remove cat. Please try again.";
      if (Platform.OS === 'web') {
        handleShowFeedback('Error', errorMessage, ModalType.ERROR);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  if (stringCatId === undefined) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <Text style={styles.errorText}>Invalid Cat ID provided in URL.</Text>
        <Button title="Go Back" onPress={handleCancel} variant="secondary" />
      </View>
    );
  }

  if (loadingCat) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <LoadingIndicator />
      </View>
    );
  }

  if (!cat) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <Text style={styles.errorText}>Failed to load cat details. The cat may not exist.</Text>
        <Button title="Go Back" onPress={handleCancel} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      {/* Feedback Modal (for web only) */}
      <FeedbackModal
        visible={showModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onDismiss={handleModalDismiss}
      />
      
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Show LoadingIndicator if updating or other data is still loading after cat is fetched */}
        {loading && <LoadingIndicator />}

        {/* Hide form content until essential data is loaded and initialized */}
        {!loading && (
          <View style={[
            styles.formContainer,
            { width: contentWidth as any, maxWidth: 600 }
          ]}>
            {/* Header with back button - styled like CatPage.tsx */}
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <TouchableOpacity 
                  style={GlobalStyles.backButton} 
                  onPress={handleCancel}
                >
                  <Text style={GlobalStyles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.title}>Edit Cat</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter cat's name"
                value={formData.catname}
                onChangeText={(value) => updateField('catname', value)}
                editable={!updating}
              />

              <Text style={styles.label}>Breed</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter cat's breed"
                value={formData.catbreed}
                onChangeText={(value) => updateField('catbreed', value)}
                editable={!updating}
              />
              
              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Age</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={styles.inputUnit}
                      placeholder="Age"
                      value={formData.catage}
                      onChangeText={(value) => updateField('catage', value)}
                      keyboardType="numeric"
                      editable={!updating}
                    />
                    <Text style={styles.unitText}>years</Text>
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Weight</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={styles.inputUnit}
                      placeholder="Weight"
                      value={formData.catweight}
                      onChangeText={(value) => updateField('catweight', value)}
                      keyboardType="numeric"
                      editable={!updating}
                    />
                    <Text style={styles.unitText}>lbs</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Length</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={styles.inputUnit}
                      placeholder="Length"
                      value={formData.catlength}
                      onChangeText={(value) => updateField('catlength', value)}
                      keyboardType="numeric"
                      editable={!updating}
                    />
                    <Text style={styles.unitText}>in</Text>
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Sex</Text>
                  {Platform.OS === 'ios' ? (
                    <>
                      <TouchableOpacity
                        style={styles.pickerTouchable}
                        onPress={() => setShowIOSSexPicker(true)}
                        disabled={updating}
                      >
                        <Text style={[styles.pickerText, { color: formData.catsex ? '#000' : '#999' }]}>
                          {formData.catsex || "Select cat sex"}
                        </Text>
                      </TouchableOpacity>

                      <Modal
                        visible={showIOSSexPicker}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowIOSSexPicker(false)}
                      >
                        <TouchableOpacity style={styles.iosPickerModalOverlay} onPress={() => setShowIOSSexPicker(false)} />
                        <View style={styles.iosPickerModal}>
                          <View style={styles.iosPickerHeader}>
                            <TouchableOpacity onPress={() => setShowIOSSexPicker(false)}>
                              <Text style={styles.iosPickerDoneBtn}>Done</Text>
                            </TouchableOpacity>
                          </View>
                          <Picker
                            selectedValue={formData.catsex}
                            onValueChange={(itemValue: string) => {
                              updateField('catsex', itemValue);
                              setShowIOSSexPicker(false);
                            }}
                            style={styles.iosPickerContent}
                            itemStyle={styles.iosPickerItem}
                          >
                            <Picker.Item label="Select cat sex" value="" />
                            <Picker.Item label="Male" value="Male" />
                            <Picker.Item label="Female" value="Female" />
                          </Picker>
                        </View>
                      </Modal>
                    </>
                  ) : (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.catsex}
                        onValueChange={(itemValue: string) => updateField('catsex', itemValue)}
                        enabled={!updating}
                        style={styles.picker}
                        prompt="Select cat sex"
                      >
                        <Picker.Item label="Select cat sex" value="" />
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                      </Picker>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.label}>Select Feeder:</Text>
              {Platform.OS === 'ios' ? (
                <>
                  <TouchableOpacity
                    style={[styles.pickerTouchable, { backgroundColor: availableFeeders.length === 0 ? '#eee' : '#fff'}]}
                    onPress={() => availableFeeders.length > 0 ? setShowIOSPicker(true) : null}
                    disabled={updating || availableFeeders.length === 0}
                  >
                    <Text style={[styles.pickerText, { color: formData.feederid ? '#000' : '#999' }]}>
                      {availableFeeders.length === 0
                        ? "No available feeders"
                        : formData.feederid
                          ? getFeederDisplayName(feeders.find(f => f.id === formData.feederid) || { id: formData.feederid }, feeders)
                          : "Select a feeder"}
                    </Text>
                  </TouchableOpacity>

                  <Modal
                    visible={showIOSPicker}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowIOSPicker(false)}
                  >
                    <TouchableOpacity style={styles.iosPickerModalOverlay} onPress={() => setShowIOSPicker(false)} />
                    <View style={styles.iosPickerModal}>
                      <View style={styles.iosPickerHeader}>
                         <TouchableOpacity onPress={() => setShowIOSPicker(false)}>
                          <Text style={styles.iosPickerDoneBtn}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <Picker
                        selectedValue={formData.feederid?.toString() || ""}
                        onValueChange={(itemValue: string | number) => {
                          let finalValue: number | null = null;
                          if (itemValue !== "" && itemValue !== null && itemValue !== undefined) {
                            const num = Number(itemValue);
                            if (!isNaN(num)) {
                              finalValue = num;
                            }
                          }
                          updateField('feederid', finalValue);
                        }}
                        style={styles.iosPickerContent}
                        itemStyle={styles.iosPickerItem}
                      >
                        <Picker.Item label="Select a feeder..." value="" />
                        {availableFeeders.map((feeder) => (
                          <Picker.Item
                            key={feeder.id.toString()}
                            label={String(getFeederDisplayName(feeder, feeders))}
                            value={feeder.id.toString()}
                          />
                        ))}
                      </Picker>
                    </View>
                  </Modal>
                </>
              ) : (
                <View style={[styles.pickerContainer, { backgroundColor: availableFeeders.length === 0 ? '#eee' : '#fff'}]}>
                  <Picker
                    selectedValue={formData.feederid}
                    onValueChange={(itemValue) => updateField('feederid', itemValue)}
                    enabled={!updating && availableFeeders.length > 0}
                    style={[styles.picker, { color: availableFeeders.length === 0 ? '#999' : '#000'}]}
                    prompt="Select a feeder"
                  >
                    <Picker.Item label="Select a feeder..." value={null} />
                    {availableFeeders.map((feeder) => (
                      <Picker.Item
                        key={feeder.id}
                        label={String(getFeederDisplayName(feeder, feeders))}
                        value={feeder.id}
                      />
                    ))}
                  </Picker>
                  {availableFeeders.length === 0 && (
                     <Text style={styles.noFeedersText}>No available feeders</Text>
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.buttonContainer}>
              <Button 
                title={updating ? 'Saving...' : 'Save Changes'} 
                variant="primary"
                onPress={handleUpdate} 
                disabled={updating || deleting}
                isLoading={updating}
                style={styles.button}
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                disabled={updating || deleting}
                style={styles.button}
              />
              
              {/* Add a divider */}
              <View style={styles.divider} />
              
              {/* Add Remove Cat button */}
              <Button
                title={deleting ? 'Removing...' : 'Remove Cat'}
                variant="danger"
                onPress={handleRemoveCat}
                disabled={updating || deleting}
                isLoading={deleting}
                style={styles.deleteButton}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default EditCatPage;

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: Platform.OS === 'web' ? 20 : 0,
    width: '100%',
  },
  formContainer: {
    width: '100%',
    alignSelf: 'center',
    padding: Platform.OS === 'web' ? 40 : 16,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 10,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: Platform.OS === 'web' ? 0 : 1,
    borderColor: '#eee',
    marginBottom: 25,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -5,
    marginBottom: 0,
  },
  halfWidth: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  fullWidth: {
    width: '100%',
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  pickerTouchable: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    justifyContent: 'center',
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    minHeight: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  picker: {
    height: Platform.OS === 'web' ? 48 : 50,
    width: '100%',
    color: '#333',
    backgroundColor: 'transparent',
  },
  noFeedersText: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 0,
    textAlignVertical: 'center',
    color: '#999',
    fontSize: 16,
  },
  iosPickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
  },
  iosPickerHeader: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  iosPickerDoneBtn: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  iosPickerContent: {
    height: 216,
    width: '100%',
    backgroundColor: '#fff',
  },
  iosPickerItem: {
    height: 216
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    width: '80%',
    maxWidth: 350,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    width: '80%',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingRight: 12,
  },
  inputUnit: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  deleteButton: {
    width: '80%',
    maxWidth: 350,
    marginTop: 5,
  }
});