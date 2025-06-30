import React, { forwardRef, useEffect, useState, useRef } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  label?: string;
  errorMessage?: string;
}

const CustomTextInput = forwardRef<TextInput, CustomTextInputProps>(
  ({ 
    containerStyle, 
    inputStyle, 
    label, 
    errorMessage, 
    onFocus, 
    onBlur, 
    placeholder,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    
    // Merge refs to support both forwardRef and internal ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else {
          (ref as React.MutableRefObject<TextInput | null>).current = inputRef.current;
        }
      }
    }, [ref]);

    // Handle focus and blur events
    const handleFocus = (e: any) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    // For mobile web, shorten placeholder if too long to prevent overflow
    const adjustedPlaceholder = Platform.OS === 'web' && placeholder && placeholder.length > 25
      ? `${placeholder.substring(0, 22)}...`
      : placeholder;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            errorMessage ? styles.inputError : null,
            // On web, we need to use this workaround for removing outline
            Platform.OS === 'web' ? { outline: 'none' } : {},
            inputStyle
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={adjustedPlaceholder}
          placeholderTextColor="#999"
          {...props}
          // Add iOS/mobile web specific props
          enterKeyHint="done"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}
      </View>
    );
  }
);

// Add displayName for debugging
CustomTextInput.displayName = 'CustomTextInput';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    minHeight: Platform.OS === 'web' ? 44 : 44, // Consistent height across all platforms
    ...(Platform.OS === 'web' ? {
      // Web-specific styles
      fontSize: 16, // Prevent zoom on iOS Safari
      maxHeight: 44, // Fix height on mobile web
    } : {}),
  },
  inputFocused: {
    borderColor: '#007bff',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
});

export default CustomTextInput; 