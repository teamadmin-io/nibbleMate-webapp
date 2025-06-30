import { Platform } from 'react-native';
import { debugLog } from '../debugging';
import { DEBUG_PREFIXES } from '../../constants';

// Network logger settings
const MAX_BODY_LOG_LENGTH = 500;
const REDACTED_FIELDS = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];
const SENSITIVE_HEADERS = ['authorization', 'cookie'];

interface RequestInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  txId: string;
}

interface ResponseInfo {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
  contentType?: string;
  bodyPreview?: string;
  timestamp: number;
  duration: number;
}

// Generate a transaction ID for request tracing
const generateTxId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// Sanitize sensitive data in objects
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (REDACTED_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Sanitize headers for logging
const sanitizeHeaders = (headers: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_HEADERS.includes(lowerKey)) {
      // For Authorization headers, we'll show the first few characters
      if (lowerKey === 'authorization' && value.includes('Bearer ')) {
        const token = value.split('Bearer ')[1];
        sanitized[key] = `Bearer ${token.substring(0, 10)}...`;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Log a network request
export const logRequest = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: any
): RequestInfo => {
  const txId = generateTxId();
  const timestamp = Date.now();
  
  // Prepare sanitized request data for logging
  const sanitizedHeaders = sanitizeHeaders(headers);
  const sanitizedBody = body ? sanitizeData(body) : undefined;
  
  // Log the request
  debugLog(`${DEBUG_PREFIXES.NETWORK} Request:${txId}`, `${method} ${url}`, {
    headers: sanitizedHeaders,
    body: sanitizedBody
  });
  
  // Add platform information for web debugging
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const webInfo = {
      origin: window.location.origin,
      currentUrl: window.location.href,
      isSecure: window.location.protocol === 'https:',
      targetIsSecure: url.startsWith('https:'),
      isOnline: navigator.onLine
    };
    
    debugLog(`${DEBUG_PREFIXES.NETWORK} WebInfo:${txId}`, 'Web platform details', webInfo);
  }
  
  return {
    url,
    method,
    headers,
    body,
    timestamp,
    txId
  };
};

// Log a network response
export const logResponse = (
  requestInfo: RequestInfo,
  response: Response,
  responseBody?: any
): ResponseInfo => {
  const timestamp = Date.now();
  const duration = timestamp - requestInfo.timestamp;
  const { url, method, txId } = requestInfo;
  
  // Extract headers
  const headers: Record<string, string> = {};
  response.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });
  
  // Content type analysis
  const contentType = headers['content-type'] || response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const isHtml = contentType.includes('text/html');
  const isText = contentType.includes('text/plain') || isJson || isHtml;
  
  // Prepare response info
  const responseInfo: ResponseInfo = {
    status: response.status,
    statusText: response.statusText,
    headers,
    contentType,
    timestamp,
    duration
  };
  
  // Log body if available
  if (responseBody !== undefined) {
    if (typeof responseBody === 'string') {
      responseInfo.bodyPreview = responseBody.length > MAX_BODY_LOG_LENGTH 
        ? `${responseBody.substring(0, MAX_BODY_LOG_LENGTH)}...` 
        : responseBody;
    } else if (responseBody !== null && typeof responseBody === 'object') {
      responseInfo.body = sanitizeData(responseBody);
    }
  }
  
  // Log with emoji based on status code
  const statusEmoji = response.ok ? DEBUG_PREFIXES.SUCCESS : DEBUG_PREFIXES.ERROR;
  
  debugLog(`${DEBUG_PREFIXES.NETWORK} Response:${txId}`, `${statusEmoji} ${method} ${url}`, {
    status: response.status,
    statusText: response.statusText,
    duration: `${duration}ms`,
    contentType,
    type: isJson ? 'json' : isHtml ? 'html' : isText ? 'text' : 'binary',
    headers: sanitizeHeaders(headers),
    body: responseInfo.body || responseInfo.bodyPreview
  });
  
  return responseInfo;
};

// Log a network error
export const logNetworkError = (
  requestInfo: RequestInfo,
  error: any
): void => {
  const timestamp = Date.now();
  const duration = timestamp - requestInfo.timestamp;
  const { url, method, txId } = requestInfo;
  
  // Extract useful error information
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // Determine error type
  let errorType = 'Generic Error';
  if (error instanceof TypeError && errorMessage.includes('Failed to fetch')) {
    errorType = 'Network Failure';
  } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    errorType = 'Timeout';
  } else if (error.name === 'AbortError') {
    errorType = 'Aborted';
  }
  
  // Build network diagnostics
  let networkDiagnostics: Record<string, any> = {
    errorType,
    duration: `${duration}ms`
  };
  
  // Add web-specific diagnostics
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const isOnline = navigator.onLine;
    const urlObj = new URL(url);
    const isCrossOrigin = urlObj.origin !== window.location.origin;
    
    networkDiagnostics = {
      ...networkDiagnostics,
      online: isOnline,
      isCrossOrigin,
      protocol: window.location.protocol,
      targetProtocol: urlObj.protocol,
      // Mixed content issue detection
      potentialMixedContent: window.location.protocol === 'https:' && urlObj.protocol === 'http:'
    };
  }
  
  debugLog(`${DEBUG_PREFIXES.NETWORK} Error:${txId}`, `${DEBUG_PREFIXES.ERROR} ${method} ${url} - ${errorType}`, 
    networkDiagnostics,
    error instanceof Error ? error : new Error(errorMessage)
  );
};

 