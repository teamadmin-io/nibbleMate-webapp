import { Platform } from 'react-native';
import { debugLog } from './debugging';
import { DEBUG_PREFIXES } from '../constants';

type DiagnosticInfo = Record<string, any>;

// Extend global with expo property
declare global {
  namespace NodeJS {
    interface Global {
      expo?: any;
    }
  }
}

// Extend Performance interface for memory property in some browsers
interface ExtendedPerformance extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

// Check if the global.expo property exists
const hasExpo = (): boolean => {
  return typeof global !== 'undefined' && 
         'expo' in global && 
         global.expo !== undefined;
};

/**
 * Collects app-wide diagnostic information
 * Useful for troubleshooting issues across different platforms
 */
export const collectDiagnostics = async (): Promise<DiagnosticInfo> => {
  const startTime = Date.now();
  debugLog('Diagnostics', 'Collecting system information');
  
  // Base diagnostic information
  const info: DiagnosticInfo = {
    timestamp: new Date().toISOString(),
    platform: {
      name: Platform.OS,
      version: Platform.Version,
      isExpo: hasExpo(),
    },
    appState: {
      // We'll populate this below
    }
  };
  
  // Add web-specific information
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    info.web = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      cookiesEnabled: navigator.cookieEnabled,
      isOnline: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      location: {
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      localStorage: typeof localStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
    };
    
    // Add connection information if available
    if ('connection' in navigator) {
      const conn = navigator.connection as any;
      if (conn) {
        info.web.connection = {
          effectiveType: conn.effectiveType,
          downlink: conn.downlink,
          rtt: conn.rtt,
          saveData: conn.saveData,
        };
      }
    }
  }
  
  // Try to get memory usage if available
  try {
    if (Platform.OS === 'web' && typeof performance !== 'undefined') {
      const extendedPerf = performance as ExtendedPerformance;
      if (extendedPerf.memory) {
        info.memory = {
          jsHeapSizeLimit: extendedPerf.memory.jsHeapSizeLimit,
          totalJSHeapSize: extendedPerf.memory.totalJSHeapSize,
          usedJSHeapSize: extendedPerf.memory.usedJSHeapSize,
        };
      }
    }
  } catch (e) {
    // Memory info not available
  }
  
  debugLog('Diagnostics', 'System information collected', info, undefined, startTime);
  return info;
};

/**
 * Monitors and logs network connectivity changes
 */
export const setupNetworkMonitoring = (): (() => void) => {
  // Only works on web for now
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return () => {}; // Return empty cleanup function
  }
  
  const logNetworkState = () => {
    const isOnline = navigator.onLine;
    const connectionInfo: Record<string, any> = { online: isOnline };
    
    // Add additional connection info if available
    if ('connection' in navigator && navigator.connection) {
      const conn = navigator.connection as any;
      Object.assign(connectionInfo, {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      });
    }
    
    debugLog(`${DEBUG_PREFIXES.NETWORK} Status`, `Network connectivity: ${isOnline ? 'Online' : 'Offline'}`, connectionInfo);
  };
  
  // Log initial state
  logNetworkState();
  
  // Add event listeners for connectivity changes
  const handleOnline = () => {
    debugLog(`${DEBUG_PREFIXES.NETWORK} Change`, 'Connection restored', { online: true });
    logNetworkState();
  };
  
  const handleOffline = () => {
    debugLog(`${DEBUG_PREFIXES.NETWORK} Change`, 'Connection lost', { online: false });
    logNetworkState();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Log detailed information about errors
 */
export const logDetailedError = (
  category: string,
  message: string,
  error: unknown,
  context?: Record<string, any>
): void => {
  // Extract useful error details
  const errorObj: Record<string, any> = {
    message: error instanceof Error ? error.message : String(error),
    type: error instanceof Error ? error.constructor.name : typeof error,
    timestamp: new Date().toISOString(),
  };
  
  // Add stack trace if available
  if (error instanceof Error && error.stack) {
    errorObj.stack = error.stack;
  }
  
  // Add context if provided
  if (context) {
    errorObj.context = context;
  }
  
  // Log with emoji indicator
  debugLog(`${DEBUG_PREFIXES.ERROR} ${category}`, message, errorObj, error instanceof Error ? error : undefined);
}; 