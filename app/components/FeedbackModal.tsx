import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { ModalType } from '../utils/helpers/feedbackHelpers';

export interface FeedbackModalProps {
  visible: boolean;
  title: string;
  message: string;
  type: ModalType;
  onDismiss: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  title,
  message,
  type,
  onDismiss
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case ModalType.SUCCESS:
        return '#4CAF50';
      case ModalType.ERROR:
        return '#F44336';
      case ModalType.WARNING:
        return '#FF9800';
      case ModalType.INFO:
      default:
        return '#2196F3';
    }
  };

  // For web (both desktop and mobile), use a fixed position modal
  if (Platform.OS === 'web') {
    if (!visible) return null; // Don't render anything if not visible
    
    return (
      <View style={styles.webModalOverlay}>
        <View style={[
          styles.webModalContent, 
          { backgroundColor: getBackgroundColor() }
        ]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // For native platforms (iOS, Android)
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: getBackgroundColor() }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const modalWidth = Math.min(300, width * 0.85);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 8,
    minWidth: 300,
    maxWidth: '80%',
  },
  // Web-specific modal styles for better mobile support
  webModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // ensure always on top
    display: 'flex',
    padding: 0,
  },
  webModalContent: {
    padding: width < 400 ? 12 : 20,
    borderRadius: 10,
    width: width < 400 ? '98%' : Math.min(340, width * 0.95),
    maxWidth: width < 400 ? '98%' : 340,
    minWidth: 220,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 120,
    marginTop: 5,
    marginBottom: 2,
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 17,
  },
});

export default FeedbackModal; 