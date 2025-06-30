import { logRequest, logResponse, logNetworkError } from './networkLogger';
import { API_URL } from '../../constants';
import { Platform } from 'react-native';
import { debugLog } from '../debugging';

// Default fetch timeout in milliseconds
const DEFAULT_TIMEOUT = 10000;

/**
 * Debug-enhanced fetch wrapper
 * 
 * This is a drop-in replacement for fetch() that adds comprehensive
 * logging for debugging network requests.
 */
export const debugFetch = async (
  url: string | URL,
  options: RequestInit = {}
): Promise<Response> => {
  // Ensure URL is properly formatted
  const fullUrl = typeof url === 'string' 
    ? (url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? url : `/${url}`}`)
    : url.toString();
  
  // Clone and normalize options
  const config: RequestInit = { ...options };
  config.method = config.method?.toUpperCase() || 'GET';
  
  // Ensure headers exist
  if (!config.headers) {
    config.headers = {};
  }
  
  // Convert Headers object to plain object for logging
  const headerObj: Record<string, string> = {};
  if (config.headers instanceof Headers) {
    config.headers.forEach((value: string, key: string) => {
      headerObj[key] = value;
    });
  } else {
    Object.assign(headerObj, config.headers);
  }
  
  // Parse body for logging if it's a JSON string
  let bodyForLogging: any = config.body;
  if (typeof config.body === 'string' && (
    headerObj['content-type']?.includes('application/json') || 
    !headerObj['content-type']
  )) {
    try {
      bodyForLogging = JSON.parse(config.body);
    } catch (e) {
      // Not JSON, keep as string
    }
  }
  
  // Log the request
  const requestInfo = logRequest(fullUrl, config.method, headerObj, bodyForLogging);
  
  // Create an abort controller for timeout handling
  const controller = new AbortController();
  if (!config.signal) {
    config.signal = controller.signal;
  }
  
  // Set timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT);
  
  try {
    // Add CORS mode for web
    if (Platform.OS === 'web') {
      config.mode = 'cors';
      config.credentials = 'include';
    }
    
    // Make the actual fetch request
    const response = await fetch(fullUrl, config);
    
    // Clone the response to read the body (we'll use this for logging)
    const clonedResponse = response.clone();
    
    // Try to extract response body based on content type
    let responseBody;
    try {
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // For JSON, parse the response
        const text = await clonedResponse.text();
        responseBody = text ? JSON.parse(text) : null;
      } else if (
        contentType.includes('text/') || 
        contentType.includes('application/xml') ||
        contentType.includes('application/javascript')
      ) {
        // For text-based formats, get as text
        responseBody = await clonedResponse.text();
      } else {
        // For other formats, just log content type
        responseBody = `[${contentType} content]`;
      }
    } catch (bodyError) {
      // If body parsing fails, log that but don't fail the request
      debugLog('NetworkLogger', 'Failed to parse response body', undefined, 
        bodyError instanceof Error ? bodyError : new Error(String(bodyError))
      );
    }
    
    // Log the response
    logResponse(requestInfo, response, responseBody);
    
    return response;
  } catch (error) {
    // Log network error
    logNetworkError(requestInfo, error);
    throw error;
  } finally {
    // Clear timeout
    clearTimeout(timeoutId);
  }
}; 