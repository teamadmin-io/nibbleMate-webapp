import { AuthFormData } from './types';
import { API_URL } from '../../../constants';

// Auth-specific debugging
const DEBUG_PREFIX = '🔐';
const authDebug = (action: string, details?: any, error?: Error, startTime?: number) => {
  let message = `${DEBUG_PREFIX} Auth: ${action}`;
  
  if (details) {
    console.log(message, details);
  } else {
    console.log(message);
  }
  
  if (error) {
    console.error(`${DEBUG_PREFIX} Error:`, error);
  }
  
  if (startTime) {
    const duration = Date.now() - startTime;
    console.log(`${DEBUG_PREFIX} Duration: ${duration}ms`);
  }
};

/**
 * Signs in with email and password
 */
export const signInWithEmail = async (formData: AuthFormData) => {
  const { email, password } = formData;
  
  if (!email || !password) {
    throw new Error('Please fill in all fields');
  }

  authDebug('Attempting sign in', { email });
  
  try {
    const response = await fetch(`${API_URL}/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Sign in failed';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch (e) {
        // If not JSON, use the raw error text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      authDebug('Sign in failed', { status: response.status }, new Error(errorMessage));
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    authDebug('Sign in successful', { userId: data.user?.id });
    
    // Store the session in localStorage
    if (data.session) {
      try {
        authDebug('Attempting to store session', { sessionExists: !!data.session });
        // Check if localStorage is available (web environment)
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('nibbleMate-session', JSON.stringify(data.session));
          authDebug('Session stored successfully');
        } else {
          authDebug('localStorage not available, session not persisted');
        }
      } catch (e) {
        authDebug('Error storing session', { error: e instanceof Error ? e.message : String(e) });
      }
    } else {
      authDebug('No session data received from server');
    }
    
    return {
      user: data.user,
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      } : null
    };
  } catch (error) {
    authDebug('Sign in error', undefined, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Signs up with email and password
 */
export const signUpWithEmail = async (formData: AuthFormData) => {
  const { email, password } = formData;
  
  if (!email || !password) {
    throw new Error('Please fill in all fields');
  }

  authDebug('Attempting sign up', { email });
  
  try {
    const response = await fetch(`${API_URL}/auth/sign-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Sign up failed';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch (e) {
        // If not JSON, use the raw error text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      authDebug('Sign up failed', { status: response.status }, new Error(errorMessage));
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    authDebug('Sign up successful', { userId: data.user?.id });
    
    // Store the session in localStorage if it exists (not always present for signup due to email verification)
    if (data.session) {
      try {
        authDebug('Attempting to store session from sign-up', { sessionExists: !!data.session });
        // Check if localStorage is available (web environment)
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('nibbleMate-session', JSON.stringify(data.session));
          authDebug('Session stored successfully');
        } else {
          authDebug('localStorage not available, session not persisted');
        }
      } catch (e) {
        authDebug('Error storing session', { error: e instanceof Error ? e.message : String(e) });
      }
    } else {
      authDebug('No session data received from server during sign-up (normal for email verification flow)');
    }
    
    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    authDebug('Sign up error', undefined, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Signs out the current user
 */
export const signOut = async () => {
  authDebug('Attempting sign out');
  
  try {
    // Get the current session
    const session = await getSession();
    if (!session) {
      authDebug('No active session to sign out');
      return;
    }
    
    const response = await fetch(`${API_URL}/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      authDebug('Sign out failed', { status: response.status, error: errorText });
      // Don't throw here, as we still want to clear the session locally
    }
    
    // Always clear local session storage regardless of API response
    try {
      authDebug('Clearing local session storage');
      // Check if localStorage is available (web environment)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('nibbleMate-session');
        authDebug('Local session cleared successfully');
      } else {
        authDebug('localStorage not available');
      }
    } catch (e) {
      authDebug('Error clearing session', { error: e instanceof Error ? e.message : String(e) });
    }
    
    authDebug('Sign out successful');
  } catch (error) {
    authDebug('Sign out error', undefined, error instanceof Error ? error : new Error(String(error)));
    
    // Always try to clear local session storage even if API call fails
    try {
      authDebug('Attempting to clear local session after API error');
      // Check if localStorage is available (web environment)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('nibbleMate-session');
        authDebug('Local session cleared successfully');
      } else {
        authDebug('localStorage not available');
      }
    } catch (e) {
      authDebug('Error clearing session', { error: e instanceof Error ? e.message : String(e) });
    }
  }
};

/**
 * Verifies an email with a token
 */
export const verifyEmail = async (token: string, email?: string) => {
  if (!email) {
    // Without an email we can't properly verify
    throw new Error('Email is required for verification');
  }
  
  authDebug('Attempting email verification', { email });
  
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, email })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Email verification failed';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch (e) {
        // If not JSON, use the raw error text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      authDebug('Email verification failed', { status: response.status }, new Error(errorMessage));
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    authDebug('Email verification successful');
    
    return {
      session: data.session
    };
  } catch (error) {
    authDebug('Email verification error', undefined, error instanceof Error ? error : new Error(String(error)));
    throw new Error('Email verification failed. Make sure you have the correct verification code and email.');
  }
};

/**
 * Gets the current session
 */
export const getSession = async () => {
  authDebug('Attempting to get session');
  
  // First, try to get the session from localStorage if we're on web
  let storedSession = null;
  
  try {
    // Check if localStorage is available (web environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      const sessionStr = window.localStorage.getItem('nibbleMate-session');
      authDebug('Session from localStorage', { exists: !!sessionStr });
      
      if (sessionStr) {
        try {
          storedSession = JSON.parse(sessionStr);
          authDebug('Session parsed', { 
            hasAccessToken: !!storedSession?.access_token,
            hasRefreshToken: !!storedSession?.refresh_token,
            expiresAt: storedSession?.expires_at 
          });
          
          // Check if the session is expired
          if (storedSession && storedSession.expires_at) {
            const expiresAt = new Date(storedSession.expires_at * 1000);
            const now = new Date();
            
            authDebug('Checking session expiration', { 
              expiresAt: expiresAt.toISOString(),
              now: now.toISOString(),
              isExpired: expiresAt < now
            });
            
            // If session is expired or will expire within the next hour, try to refresh
            const expiresInOneHour = new Date(now.getTime() + 60 * 60 * 1000);
            if (expiresAt < expiresInOneHour) {
              // Session is expired or expiring soon, try to refresh
              authDebug('Session expired or expiring soon, attempting refresh');
              try {
                const refreshed = await refreshSession(storedSession.refresh_token);
                if (refreshed) {
                  authDebug('Session refreshed successfully');
                  storedSession = refreshed;
                  window.localStorage.setItem('nibbleMate-session', JSON.stringify(refreshed));
                } else {
                  // Even if refresh fails, let's try to use the existing token if it's not actually expired yet
                  if (expiresAt > now) {
                    authDebug('Refresh failed, but current token still valid. Using existing session.');
                    return storedSession;
                  }
                  
                  authDebug('Session refresh failed, clearing session');
                  window.localStorage.removeItem('nibbleMate-session');
                  storedSession = null;
                }
              } catch (e) {
                authDebug('Error refreshing session', { error: e instanceof Error ? e.message : String(e) });
                
                // Even if refresh fails, let's try to use the existing token if it's not actually expired yet
                if (expiresAt > now) {
                  authDebug('Refresh failed, but current token still valid. Using existing session.');
                  return storedSession;
                }
                
                window.localStorage.removeItem('nibbleMate-session');
                storedSession = null;
              }
            } else {
              authDebug('Session is still valid');
            }
          } else {
            authDebug('Session missing expires_at timestamp');
          }
        } catch (e) {
          authDebug('Error parsing session JSON', { error: e instanceof Error ? e.message : String(e) });
          window.localStorage.removeItem('nibbleMate-session');
        }
      }
    } else {
      authDebug('localStorage not available');
    }
  }
  catch (e) {
    authDebug('Error accessing localStorage', { error: e instanceof Error ? e.message : String(e) });
  }
  
  return storedSession;
};

/**
 * Refreshes the current session using a refresh token
 */
export const refreshSession = async (refreshToken: string) => {
  authDebug('Attempting to refresh session');
  
  // Add retry logic for better resilience
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      authDebug(`Refresh attempt ${attempt}/${maxRetries}`);
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (!response.ok) {
        authDebug('Session refresh failed', { status: response.status });
        if (attempt < maxRetries) {
          authDebug(`Waiting before retry ${attempt+1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        return null;
      }
      
      const result = await response.json();
      
      if (result.error) {
        authDebug('Session refresh returned error', { error: result.error });
        if (attempt < maxRetries) {
          authDebug(`Waiting before retry ${attempt+1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        return null;
      }
      
      if (!result.data) {
        authDebug('Session refresh returned no data');
        if (attempt < maxRetries) {
          authDebug(`Waiting before retry ${attempt+1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        return null;
      }
      
      authDebug('Session refresh successful');
      
      return {
        access_token: result.data.access_token,
        refresh_token: result.data.refresh_token,
        expires_at: result.data.expires_at
      };
    } catch (error) {
      authDebug('Session refresh error', undefined, error instanceof Error ? error : new Error(String(error)));
      if (attempt < maxRetries) {
        authDebug(`Waiting before retry ${attempt+1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      return null;
    }
  }
  
  return null;
};

/**
 * Checks if the current token is valid
 */
export const validateToken = async (token: string) => {
  authDebug('Validating token');
  
  // Check if token looks like a valid JWT format before making API call
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    authDebug('Token validation failed: Invalid JWT format');
    return false;
  }
  
  try {
    // Try a lightweight client-side validation first (check expiry from payload)
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiry = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        
        if (expiry && expiry < now) {
          authDebug('Token validation failed: Token has expired (client check)', {
            expiry: new Date(expiry * 1000).toISOString(),
            now: new Date(now * 1000).toISOString()
          });
          return false;
        }
        
        authDebug('Client-side token validation passed, checking with server');
      } catch (e) {
        authDebug('Error parsing token payload', { error: e instanceof Error ? e.message : String(e) });
        // Continue with server validation if local parsing fails
      }
    }
    
    // Make the server validation request with timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        authDebug('Token validation failed', { status: response.status });
        return false;
      }
      
      const data = await response.json();
      authDebug('Token validation successful', { valid: data.valid });
      
      return data.valid === true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle abort error separately
      if (fetchError.name === 'AbortError') {
        authDebug('Token validation request timed out');
        
        // Fall back to client-side validation only in case of network issues
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expiry = payload.exp;
            const now = Math.floor(Date.now() / 1000);
            
            // Add a safety margin - consider tokens valid only if they have at least 1 hour left
            const safetyMargin = 3600; // 1 hour in seconds
            const isValid = expiry && expiry > (now + safetyMargin);
            
            authDebug('Fallback to client-side validation due to timeout', { 
              isValid, 
              expiry: new Date(expiry * 1000).toISOString(),
              expiresIn: expiry - now
            });
            
            return isValid;
          } catch (e) {
            authDebug('Error during fallback validation', { error: e instanceof Error ? e.message : String(e) });
            return false;
          }
        }
        
        return false;
      }
      
      // Regular fetch error
      authDebug('Token validation error', undefined, fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
      return false;
    }
  } catch (error) {
    authDebug('Token validation error', undefined, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

/**
 * Gets the current user info
 */
export const getUserInfo = async () => {
  authDebug('Fetching user info');
  
  try {
    const session = await getSession();
    if (!session?.access_token) {
      authDebug('No authenticated user');
      return null;
    }
    
    const response = await fetch(`${API_URL}/auth/user`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      authDebug('User info fetch failed', { status: response.status });
      return null;
    }
    
    const data = await response.json();
    authDebug('User info fetch successful', { id: data.id });
    
    return data;
  } catch (error) {
    authDebug('User info fetch error', undefined, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
};

/**
 * Updates the user's username
 */
export const updateUsername = async (username: string) => {
  authDebug('Updating username', { username });
  
  try {
    const session = await getSession();
    if (!session?.access_token) {
      authDebug('No authenticated user');
      throw new Error('You must be logged in to update your username');
    }
    
    const response = await fetch(`${API_URL}/auth/user`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update username';
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch (e) {
        // If not JSON, use the raw error text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      authDebug('Username update failed', { status: response.status, error: errorMessage });
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    authDebug('Username update successful', { username: data.username });
    
    return data;
  } catch (error) {
    authDebug('Username update error', undefined, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};