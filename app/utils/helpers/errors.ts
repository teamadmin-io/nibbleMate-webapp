import { Alert, Platform } from 'react-native';
import { debugLog } from '../../debugging';

/**
 * Standardized error handling for API calls
 * @param error The error that occurred
 * @param fallbackMessage Default message if error doesn't have a message
 * @param showAlert Whether to show an alert to the user
 * @param category Logging category
 * @param showFeedbackFn Optional function to show feedback on web platforms
 * @returns The error object with a message
 */
export const handleError = (
  error: unknown, 
  fallbackMessage = 'An unknown error occurred', 
  showAlert = true,
  category = 'Error',
  showFeedbackFn?: (title: string, message: string, type: any) => void
): Error => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : fallbackMessage;
  
  if (showAlert) {
    // For web platforms, use the provided feedback function if available
    if (Platform.OS === 'web' && showFeedbackFn) {
      showFeedbackFn('Error', errorMessage, 'error');
    }
    // For native platforms, use Alert directly
    else if (Platform.OS !== 'web') {
      Alert.alert('Error', errorMessage);
    }
    // If no feedback function is provided for web, the component should handle errors itself
  }
  
  // Enhanced error logging
  debugLog(category, 'error occurred', { message: errorMessage }, error instanceof Error ? error : undefined);
  
  return error instanceof Error 
    ? error 
    : new Error(errorMessage);
};

/**
 * Standardized API call wrapper with error handling
 * @param apiCall Async function to execute
 * @param errorMessage Message to show if an error occurs
 * @param showAlert Whether to show an alert on error
 * @param category Logging category
 * @param showFeedbackFn Optional function to show feedback on web platforms
 * @returns Result of the API call or null on error
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage = 'Operation failed',
  showAlert = true,
  category = 'API',
  showFeedbackFn?: (title: string, message: string, type: any) => void
): Promise<{ success: boolean; data?: T; error?: Error }> {
  const startTime = Date.now();
  debugLog(category, 'API call starting', undefined, undefined, startTime);
  
  try {
    const data = await apiCall();
    debugLog(category, 'API call successful', { hasData: !!data }, undefined, startTime);
    return { success: true, data };
  } catch (error) {
    const processedError = handleError(error, errorMessage, showAlert, category, showFeedbackFn);
    debugLog(category, 'API call failed', { message: errorMessage }, error instanceof Error ? error : undefined, startTime);
    return { success: false, error: processedError };
  }
}

/**
 * Inspects a server response and provides detailed diagnostics
 * Particularly useful for identifying API mismatches like 405 errors
 * @param response The fetch response object
 * @param endpoint The endpoint that was called
 * @param method The HTTP method that was used
 * @returns An object with diagnostic information
 */
export const inspectServerResponse = async (
  response: Response, 
  endpoint: string, 
  method: string
): Promise<{
  ok: boolean,
  status: number,
  contentType: string,
  isHtml: boolean,
  isJson: boolean,
  bodyPreview: string,
  diagnostics: string
}> => {
  const status = response.status;
  const contentType = response.headers.get('content-type') || '';
  const isHtml = contentType.includes('text/html');
  const isJson = contentType.includes('application/json');
  
  debugLog('APIResponse', `Response from ${method} ${endpoint}`, {
    status,
    contentType,
    ok: response.ok
  });
  
  let bodyPreview = '';
  let bodyText = '';
  
  try {
    bodyText = await response.clone().text();
    bodyPreview = bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '');
    debugLog('APIResponse', 'Response body preview', { preview: bodyPreview });
  } catch (e) {
    debugLog('APIResponse', 'Could not read response body', undefined, e instanceof Error ? e : undefined);
  }
  
  // Specific diagnostics for common problems
  let diagnostics = '';
  
  if (status === 405) {
    diagnostics = `The server doesn't allow ${method} requests to ${endpoint}. Try a different HTTP method.`;
    
    // Suggest possible working methods
    if (method === 'GET') {
      diagnostics += ' POST or OPTIONS might be accepted instead.';
    } else if (method === 'POST') {
      diagnostics += ' GET or PUT might be accepted instead.';
    }
  } else if (status === 404) {
    diagnostics = `The endpoint ${endpoint} doesn't exist on the server.`;
  } else if (status === 403) {
    diagnostics = `Authentication token was rejected or lacks permission for ${endpoint}.`;
  } else if (status === 401) {
    diagnostics = `Authentication is required for ${endpoint}.`;
  } else if (isHtml && status >= 400) {
    diagnostics = `The server returned an HTML error page instead of JSON data. This often indicates a routing issue or server-side error.`;
  } else if (!response.ok) {
    diagnostics = `Unexpected error response from server.`;
  }
  
  if (diagnostics) {
    debugLog('APIResponse', 'Response diagnostics', { diagnostics });
  }
  
  return {
    ok: response.ok,
    status,
    contentType,
    isHtml,
    isJson,
    bodyPreview,
    diagnostics
  };
};