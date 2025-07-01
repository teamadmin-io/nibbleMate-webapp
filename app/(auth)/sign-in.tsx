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
import { useSignIn } from '../utils/features/auth/hooks';
import { useAuth } from '../utils/contexts/AuthProvider';
import { useDemo } from '../utils/contexts/DemoProvider';
import { getSession } from '../utils/features/auth/api';
import FeedbackModal from '../components/FeedbackModal';
import { ModalType, showFeedback } from '../utils/helpers/feedbackHelpers';

export default function SignInScreen(): JSX.Element {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [hasAttemptedSignIn, setHasAttemptedSignIn] = React.useState(false);
  const { signIn, loading } = useSignIn();
  const { session, initialized } = useAuth();
  const { enterDemoMode } = useDemo();
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
  
  // Debug function for auth
  const authDebug = (action: string, details?: any) => {
    console.log(`🔐 Auth: ${action}`, details || '');
  };

  // Check for existing session when landing directly on sign-in page
  React.useEffect(() => {
    const checkSession = async () => {
      if (initialized) {
        authDebug('Checking for existing session', { initialized, hasSession: !!session });
        
        try {
          // If we already have a session in context, just redirect
          if (session) {
            authDebug('Session found in context, redirecting to home');
            router.replace('/(home)');
            return;
          }
          
          // Check for a session in storage
          authDebug('No session in context, checking storage');
          const restoredSession = await getSession();
          
          if (restoredSession) {
            authDebug('Found existing session, redirecting to home');
            router.replace('/(home)');
          } else {
            authDebug('No session found, showing sign-in form');
            // Start the fade-in animation once auth check is complete
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        } catch (error) {
          authDebug('Error checking session', { error });
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

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSignIn = async () => {
    authDebug('Starting sign-in process', { email });
    setHasAttemptedSignIn(true);

    if (!validateInputs()) {
      authDebug('Validation failed');
      handleShowFeedback(
        'Sign In Error',
        'Please fix the errors in the form before continuing.',
        ModalType.ERROR
      );
      return;
    }
    
    try {
      authDebug('Making API request to sign in');
      await signIn({ email, password });
    } catch (error) {
      authDebug('Sign-in error', { error });
      handleShowFeedback(
        'Sign In Error',
        error instanceof Error ? error.message : 'Failed to sign in. Please try again.',
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
      <View style={[GlobalStyles.container, { backgroundColor: '#fff' }, styles.centerContent]}>
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
        <View style={GlobalStyles.container}>
          {/* Feedback Modal - works on all web platforms */}
          <FeedbackModal
            visible={showModal}
            title={modalTitle}
            message={modalMessage}
            type={modalType}
            onDismiss={handleModalDismiss}
          />

          <View style={[GlobalStyles.responsiveContentContainer, styles.formContainer]}>
            <Text style={[GlobalStyles.title, styles.title]}>Sign In</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  GlobalStyles.input,
                  styles.input,
                  emailError && hasAttemptedSignIn ? styles.inputError : null
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
              {emailError && hasAttemptedSignIn && (
                <Text style={styles.errorText}>{emailError}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[
                  GlobalStyles.input,
                  styles.input,
                  passwordError && hasAttemptedSignIn ? styles.inputError : null
                ] as TextStyle[]}
                value={password}
                placeholder="Enter your password"
                secureTextEntry={true}
                onChangeText={text => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                editable={!loading}
                accessibilityLabel="Password input"
              />
              {passwordError && hasAttemptedSignIn && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}
            </View>

            <Button
              title="Sign In"
              variant="primary"
              onPress={handleSignIn}
              isLoading={loading}
              disabled={loading}
              style={styles.button}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Try Demo Mode"
              variant="secondary"
              onPress={enterDemoMode}
              style={styles.demoButton}
            />

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign Up</Text>
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
  button: {
    marginTop: 10,
    height: 50
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: '#666',
  },
  demoButton: {
    backgroundColor: '#28a745',
    marginBottom: 10,
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