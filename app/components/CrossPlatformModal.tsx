import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ViewStyle,
  TextStyle
} from 'react-native';

interface CrossPlatformModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  avoidKeyboard?: boolean;
  modalStyle?: ViewStyle;
  overlayStyle?: ViewStyle;
  isDropdown?: boolean;
}

const CrossPlatformModal: React.FC<CrossPlatformModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  avoidKeyboard = true,
  modalStyle,
  overlayStyle,
  isDropdown = false
}) => {
  const { width, height } = Dimensions.get('window');
  const isMobile = width < 768;
  
  // Use a different implementation for web
  if (Platform.OS === 'web') {
    if (!visible) return null;
    
    return (
      <View style={[
        styles.webModalWrapper, 
        isDropdown && isMobile ? styles.webDropdownWrapper : null,
        overlayStyle
      ]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.webBackdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[
          styles.webModalContainer,
          isDropdown && isMobile ? styles.webDropdownContainer : null
        ]}>
          {avoidKeyboard ? (
            <KeyboardAvoidingView behavior="position" style={styles.webKeyboardAvoid}>
              <View style={[
                styles.webModalContent, 
                isDropdown && isMobile ? styles.webDropdownContent : null,
                modalStyle
              ]}>
                {title && (
                  <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {showCloseButton && (
                      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {width < 600 ? (
                  <View
                    style={[
                      styles.contentContainer,
                      isDropdown && isMobile ? styles.dropdownContentContainer : null
                    ]}
                  >
                    {children}
                  </View>
                ) : (
                  <ScrollView 
                    contentContainerStyle={[
                      styles.contentContainer,
                      isDropdown && isMobile ? styles.dropdownContentContainer : null
                    ]}
                    keyboardShouldPersistTaps="handled"
                  >
                    {children}
                  </ScrollView>
                )}
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View style={[
              styles.webModalContent, 
              isDropdown && isMobile ? styles.webDropdownContent : null,
              modalStyle
            ]}>
              {title && (
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{title}</Text>
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {width < 600 ? (
                <View
                  style={[
                    styles.contentContainer,
                    isDropdown && isMobile ? styles.dropdownContentContainer : null
                  ]}
                >
                  {children}
                </View>
              ) : (
                <ScrollView 
                  contentContainerStyle={[
                    styles.contentContainer,
                    isDropdown && isMobile ? styles.dropdownContentContainer : null
                  ]}
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Native implementation for iOS
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.modalContainer, 
          isDropdown ? styles.dropdownModalContainer : null,
          overlayStyle
        ]}
        enabled={avoidKeyboard}
      >
        <View style={[
          styles.modalContent, 
          isDropdown ? styles.dropdownModalContent : null,
          modalStyle
        ]}>
          {title && (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {width < 600 ? (
            <View
              style={[
                styles.contentContainer,
                isDropdown ? styles.dropdownContentContainer : null
              ]}
            >
              {children}
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={[
                styles.contentContainer,
                isDropdown ? styles.dropdownContentContainer : null
              ]}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375 || height < 667;

// Define styles with proper type annotations
interface Styles {
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  titleContainer: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
  contentContainer: ViewStyle;
  webModalWrapper: ViewStyle;
  webBackdrop: ViewStyle;
  webModalContainer: ViewStyle;
  webKeyboardAvoid: ViewStyle;
  webModalContent: ViewStyle;
  // Dropdown specific styles
  dropdownModalContainer: ViewStyle;
  dropdownModalContent: ViewStyle;
  dropdownContentContainer: ViewStyle;
  webDropdownWrapper: ViewStyle;
  webDropdownContainer: ViewStyle;
  webDropdownContent: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: isSmallScreen ? 16 : 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: Platform.OS === 'web' ? 'relative' : undefined,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingBottom: 10,
    flexShrink: 1,
  },
  // Web-specific styles
  webModalWrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    pointerEvents: 'auto',
    paddingTop: width < 450 ? 10 : width < 600 ? 20 : 0,
    paddingBottom: width < 450 ? 30 : width < 600 ? 20 : 0,
    height: '100%',
    maxHeight: '100%',
  },
  webBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  webModalContainer: {
    position: 'relative',
    zIndex: 2,
    width: '95%',
    maxWidth: 480,
    maxHeight: width < 450 ? '85%' : '90%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    overflow: 'visible',
    flexDirection: 'column',
  },
  webKeyboardAvoid: {
    width: '100%',
  },
  webModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: width < 450 ? 12 : width < 600 ? 14 : 28,
    paddingBottom: width < 450 ? 16 : width < 600 ? 18 : 28,
    width: '100%',
    maxHeight: Platform.OS === 'web' ? 
      (width < 600 ? 'auto' : 500) : '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'visible',
    position: 'relative',
    top: 0,
    minHeight: width < 600 ? 'auto' : undefined,
  },
  
  // Dropdown-specific styles
  dropdownModalContainer: {
    justifyContent: 'flex-start',
    paddingTop: 80, // Start from top with some padding
  },
  dropdownModalContent: {
    maxHeight: '85%', // Allow dropdown to use more screen space
    width: '95%',
  },
  dropdownContentContainer: {
    paddingBottom: 20, // More space for options
  },
  // Web dropdown styles
  webDropdownWrapper: {
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  webDropdownContainer: {
    justifyContent: 'flex-start',
    maxHeight: '85%',
    width: '100%',
  },
  webDropdownContent: {
    maxHeight: '80%',
    width: '95%',
    maxWidth: 460,
    padding: 16,
    borderRadius: 12,
  },
});

export default CrossPlatformModal; 