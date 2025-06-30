import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Platform, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';
import FeedbackModal from '../components/FeedbackModal';
import { showFeedback, ModalType } from '../utils/helpers/feedbackHelpers';
import { useCreateCat, useCats } from '../utils/features/cats/hooks';
import { useFeeders } from '../utils/features/feeders/hooks';
import { CatFormData } from '../utils/features/cats/types';
import { useForm } from '../utils/helpers/forms';
import { getFeederDisplayName } from '../utils/helpers/feederHelpers';

const CreateCatPage = () => {
  const router = useRouter();
  const { feeders = [], loading: loadingFeeders } = useFeeders();
  const { cats = [], loading: loadingCats } = useCats();
  const { create, loading: creating } = useCreateCat();
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [showIOSSexPicker, setShowIOSSexPicker] = useState(false);

  // Modal state (for web only)
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>(ModalType.SUCCESS);

  // Helper function to show feedback
  const handleShowFeedback = useCallback((title: string, message: string, type: ModalType) => {
    showFeedback(
      title, 
      message, 
      type, 
      setShowModal, 
      setModalTitle, 
      setModalMessage, 
      setModalType
    );
  }, []);

  // Add goBack function
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const { formData, updateField, setFormData } = useForm<CatFormData>({
    catname: '',
    catbreed: '',
    catage: '',
    catweight: '',
    catlength: '',
    catsex: '',
    feederid: null,
    microchip: '',
  });

  // Only feeders not already assigned to a cat - memoized calculation
  const availableFeeders = React.useMemo(() => 
    feeders.filter(f => !cats.find(c => c.feederid === f.id)),
  [feeders, cats]);
  
  const loading = creating || loadingFeeders || loadingCats;

  const handleCreate = async () => {
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
    
    try {
      // Convert string numeric values to actual numbers
      const processedFormData = {
        ...formData,
        catage: Number(formData.catage),
        catweight: Number(formData.catweight),
        catlength: Number(formData.catlength),
        microchip: null,  // Always set to null, will be updated by hardware
      };
      
      // For web platform, use our custom modals
      // For native platforms, we'll handle alerts here to ensure consistency
      const skipAlert = true; // Skip all native alerts inside the create function
      const result = await create(processedFormData, skipAlert);
      
      // Show success feedback on all platforms
      if (Platform.OS === 'web') {
        // Show success in web modal
        handleShowFeedback('Success', 'Cat created successfully!', ModalType.SUCCESS);
      } else {
        // Show success in native Alert
        Alert.alert(
          "Success",
          "Cat created successfully!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (e: any) {
      console.error('Error from create function:', e.message);
      // Show error feedback on all platforms
      handleShowFeedback('Error', e.message || 'Failed to create cat. Please try again.', ModalType.ERROR);
    }
  };

  if (loading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <LoadingIndicator />
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
        onDismiss={() => setShowModal(false)}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContainer}>
          <View style={styles.headerContainer}>
            {/* Back button with the same structure as CatPage.tsx */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={GlobalStyles.backButton} 
                onPress={goBack}
              >
                <Text style={GlobalStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formWrapper}>
            <Text style={styles.title}>Create Cat</Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.catname}
                onChangeText={(value) => updateField('catname', value)}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Breed"
                value={formData.catbreed}
                onChangeText={(value) => updateField('catbreed', value)}
                editable={!loading}
              />

              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={styles.inputUnit}
                      placeholder="Age"
                      value={formData.catage}
                      onChangeText={(value) => updateField('catage', value)}
                      keyboardType="numeric"
                      editable={!loading}
                    />
                    <Text style={styles.unitText}>years</Text>
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={styles.inputUnit}
                      placeholder="Weight"
                      value={formData.catweight}
                      onChangeText={(value) => updateField('catweight', value)}
                      keyboardType="numeric"
                      editable={!loading}
                    />
                    <Text style={styles.unitText}>lbs</Text>
                  </View>
                </View>
              </View>

              <View style={styles.rowContainer}>
                <View style={styles.halfWidth}>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={styles.inputUnit}
                      placeholder="Length"
                      value={formData.catlength}
                      onChangeText={(value) => updateField('catlength', value)}
                      keyboardType="numeric"
                      editable={!loading}
                    />
                    <Text style={styles.unitText}>in</Text>
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  {Platform.OS === 'ios' ? (
                    <>
                      <TouchableOpacity 
                        style={[styles.pickerContainer, { 
                          justifyContent: 'center', 
                          paddingHorizontal: 12,
                          height: 48,  // Match the input field height
                          borderWidth: 1,
                          borderColor: '#ddd',
                          borderRadius: 8,
                          backgroundColor: '#fff'
                        }]}
                        onPress={() => setShowIOSSexPicker(true)}
                      >
                        <Text style={{ 
                          color: formData.catsex ? '#000' : '#999',
                          fontSize: 16
                        }}>
                          {formData.catsex || "Select cat sex"}
                        </Text>
                      </TouchableOpacity>

                      <Modal
                        visible={showIOSSexPicker}
                        transparent={true}
                        animationType="slide"
                      >
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
                        onValueChange={(itemValue: string) => {
                          updateField('catsex', itemValue);
                        }}
                        enabled={!loading}
                        style={styles.picker}
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
                    style={[styles.pickerContainer, { 
                      justifyContent: 'center', 
                      paddingHorizontal: 12,
                      height: 48,  // Match the input field height
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8,
                      backgroundColor: '#fff'
                    }]}
                    onPress={() => availableFeeders.length > 0 ? setShowIOSPicker(true) : null}
                  >
                    <Text style={{ 
                      color: formData.feederid ? '#000' : '#999',
                      fontSize: 16
                    }}>
                      {formData.feederid 
                        ? getFeederDisplayName(
                            availableFeeders.find(f => f.id === formData.feederid) || { id: formData.feederid },
                            availableFeeders
                          )
                        : "Select a feeder"}
                    </Text>
                  </TouchableOpacity>

                  <Modal
                    visible={showIOSPicker}
                    transparent={true}
                    animationType="slide"
                  >
                    <View style={styles.iosPickerModal}>
                      <View style={styles.iosPickerHeader}>
                        <TouchableOpacity onPress={() => setShowIOSPicker(false)}>
                          <Text style={styles.iosPickerDoneBtn}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <Picker
                        selectedValue={formData.feederid?.toString() || ""}
                        onValueChange={(itemValue: string) => {
                          updateField('feederid', itemValue ? parseInt(itemValue, 10) : null);
                          setShowIOSPicker(false);
                        }}
                        style={styles.iosPickerContent}
                      >
                        <Picker.Item label="Select a feeder" value="" />
                        {availableFeeders.map((feeder) => (
                          <Picker.Item 
                            key={feeder.id.toString()} 
                            label={String(getFeederDisplayName(feeder, availableFeeders))}
                            value={feeder.id.toString()}
                          />
                        ))}
                      </Picker>
                    </View>
                  </Modal>
                </>
              ) : (
                <View style={styles.pickerContainer}>
                  {availableFeeders.length > 0 ? (
                    <Picker
                      selectedValue={formData.feederid?.toString() || ""}
                      onValueChange={(itemValue: string) => {
                        updateField('feederid', itemValue ? parseInt(itemValue, 10) : null);
                      }}
                      enabled={!loading}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select a feeder" value="" />
                      {availableFeeders.map((feeder) => (
                        <Picker.Item
                          key={feeder.id.toString()}
                          label={String(getFeederDisplayName(feeder, availableFeeders))}
                          value={feeder.id.toString()}
                        />
                      ))}
                    </Picker>
                  ) : (
                    <View style={styles.noFeedersContainer}>
                      <Text style={styles.noFeedersText}>No available feeders</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <Button 
                title={creating ? 'Creating...' : 'Create Cat'} 
                variant="primary"
                onPress={handleCreate} 
                disabled={loading}
                isLoading={creating}
                style={styles.button}
              />

              <Button 
                title="Cancel"
                variant="secondary"
                onPress={() => router.back()}
                disabled={loading}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateCatPage;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 16,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
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
  formWrapper: {
    width: '100%',
    maxWidth: 600,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: Platform.OS === 'ios' ? 1 : 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: 48,  // Match input field height
    marginBottom: 16, // Match other inputs' bottom margin
  },
  picker: {
    ...(Platform.OS === 'ios' ? {
      height: 48,  // Match input field height
      width: '100%',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
    } : {
      height: 48,  // Match input field height
      width: '100%',
      backgroundColor: 'transparent',
    }),
  },
  buttonContainer: {
    gap: 12,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 400,
  },
  iosPickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  iosPickerHeader: {
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#dedede',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iosPickerDoneBtn: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  iosPickerContent: {
    backgroundColor: '#fff',
    height: 250,
  },
  noFeedersContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noFeedersText: {
    color: '#999',
    fontSize: 16,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingRight: 12,
  },
  inputUnit: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
});