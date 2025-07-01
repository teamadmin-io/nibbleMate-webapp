import * as React from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  TextStyle,
  Platform
} from 'react-native';
import { router, Link } from 'expo-router';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import { useSignUp } from '../utils/features/auth/hooks';
import { useAuth } from '../utils/contexts/AuthProvider';
import { getSession } from '../utils/features/auth/api';
import FeedbackModal from '../components/FeedbackModal';
import { ModalType, showFeedback } from '../utils/helpers/feedbackHelpers';

export default function SignUpScreen(): JSX.Element {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState('');
  const [hasAttemptedSignUp, setHasAttemptedSignUp] = React.useState(false);
  const { signUp, loading } = useSignUp();
  const { session, initialized } = useAuth();
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Feedback modal state (works on all platforms)
  const [showModal, setShowModal] = React.useState(false);
  const [modalMessage, setModalMessage] = React.useState('');
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalType, setModalType] = React.useState<ModalType>(ModalType.SUCCESS);
  
  // Helper function to show feedback
  const handleShowFeedback = React.useCallback((title: string, message: string, type: ModalType) => {
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
  
  // Check for existing session when landing directly on sign-up page
  React.useEffect(() => {
    const checkSession = async () => {
      if (initialized) {
        console.log('📝 Sign-up screen - checking for existing session...');
        
        try {
          // If we already have a session in context, redirect
          if (session) {
            console.log('✅ Session already in context, redirecting from sign-up...');
            router.replace('/(home)');
            return;
          }
          
          // Check all storage mechanisms for a session
          const restoredSession = await getSession();
          
          if (restoredSession) {
            console.log('✅ Found existing session on sign-up page, redirecting...');
            router.replace('/(home)');
          } else {
            console.log('🔒 No session found, showing sign-up form');
            // Start the fade-in animation once auth check is complete
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        } catch (error) {
          console.error('❌ Error checking session on sign-up page:', error);
          // Still show the form if there's an error
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } finally {
          setIsCheckingSession(false);
        }
      }
    };
    
    checkSession();
  }, [initialized, session, fadeAnim]);

  const validateInputs = (): boolean => {
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password validation with complexity requirements
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      // Check for complexity requirements
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      
      if (!hasUppercase || !hasLowercase || !hasDigit) {
        const missing = [];
        if (!hasUppercase) missing.push('an uppercase letter');
        if (!hasLowercase) missing.push('a lowercase letter');
        if (!hasDigit) missing.push('a number');
        
        setPasswordError(`Password must contain ${missing.join(', ')}`);
        isValid = false;
      } else {
        setPasswordError('');
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleSignUp = async () => {
    console.log(`🔒 Starting sign-up process for: ${email}`);
    setHasAttemptedSignUp(true);

    if (!validateInputs()) {
      console.warn('⚠️ Validation failed');
      handleShowFeedback(
        'Sign Up Error',
        'Please fix the errors in the form before continuing.',
        ModalType.ERROR
      );
      return;
    }

    try {
      // Attempt sign up
      console.log('🔑 Calling signUp API function');
      await signUp({ email, password });
    } catch (error) {
      console.error('❌ Sign-up error:', error);
      handleShowFeedback(
        'Sign Up Error',
        error instanceof Error ? error.message : 'Failed to sign up. Please try again.',
        ModalType.ERROR
      );
    }
  };

  // Handle feedback modal dismiss
  const handleModalDismiss = React.useCallback(() => {
    setShowModal(false);
  }, []);

  // Show loading indicator while checking session
  if (isCheckingSession) {
    return (
      <View style={[GlobalStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[
      { flex: 1, opacity: fadeAnim }
    ]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[GlobalStyles.container, { backgroundColor: '#fff' }]}>
          {/* Feedback Modal - works on all web platforms */}
          <FeedbackModal
            visible={showModal}
            title={modalTitle}
            message={modalMessage}
            type={modalType}
            onDismiss={handleModalDismiss}
          />

          <View style={[GlobalStyles.responsiveContentContainer, styles.formContainer]}>
            <Text style={[GlobalStyles.title, styles.title]}>Create Account</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  GlobalStyles.input,
                  styles.input,
                  emailError && hasAttemptedSignUp ? styles.inputError : null
                ] as TextStyle[]}
                autoCapitalize="none"
                value={email}
                placeholder="Enter your email"
                onChangeText={text => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                editable={!loading}
                keyboardType="email-address"
                accessibilityLabel="Email input"
              />
              {emailError && hasAttemptedSignUp ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[
                  GlobalStyles.input,
                  styles.input,
                  passwordError && hasAttemptedSignUp ? styles.inputError : null
                ] as TextStyle[]}
                value={password}
                placeholder="Create a password"
                secureTextEntry={true}
                onChangeText={text => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                editable={!loading}
                accessibilityLabel="Password input"
              />
              {passwordError && hasAttemptedSignUp ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : (
                <Text style={styles.helperText}>Password must be at least 8 characters and include uppercase, lowercase, and numbers</Text>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={[
                  GlobalStyles.input,
                  styles.input,
                  confirmPasswordError && hasAttemptedSignUp ? styles.inputError : null
                ] as TextStyle[]}
                value={confirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={true}
                onChangeText={text => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                editable={!loading}
                accessibilityLabel="Confirm password input"
              />
              {confirmPasswordError && hasAttemptedSignUp ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>
            
            <Button
              title="Sign Up"
              variant="primary" 
              onPress={handleSignUp}
              isLoading={loading}
              disabled={loading}
              style={styles.button}
            />
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  scrollContainer: {
    flexGrow: 1
  },
  formContainer: {
    justifyContent: 'center',
    maxWidth: 450
  },
  title: {
    marginBottom: 30
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fcfcfc'
  } as TextStyle,
  inputError: {
    borderColor: '#d9534f',
    backgroundColor: '#fff8f8'
  } as TextStyle,
  errorText: {
    color: '#d9534f',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 2
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2
  },
  button: {
    marginTop: 10,
    height: 50
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    flexWrap: 'wrap'
  },
  linkText: {
    fontSize: 16,
    color: '#666'
  },
  link: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
    textDecorationLine: 'underline'
  }
});