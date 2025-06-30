import { Platform } from 'react-native';
import { debugLog } from '../../../debugging';

// Define a history structure to track auth-related events
interface AuthEvent {
  component: string;
  event: string;
  details?: any;
  timestamp: number;
  duration?: number;
}

class AuthFlowHistory {
  private events: AuthEvent[] = [];
  private maxEvents: number = 100;

  constructor() {
    debugLog('AuthHistory', 'Initialized auth flow history tracker');
  }

  addEvent(component: string, event: string, details?: any, duration?: number): void {
    const newEvent: AuthEvent = {
      component,
      event,
      details,
      timestamp: Date.now(),
      duration
    };

    // Add to beginning of array (more recent first)
    this.events.unshift(newEvent);
    
    // Trim if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
  }

  getEvents(): AuthEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
    debugLog('AuthHistory', 'Cleared auth flow history');
  }
}

// Create a singleton instance
export const authFlowHistory = new AuthFlowHistory();

/**
 * Track an authentication flow event
 */
export const trackAuthEvent = (
  component: string, 
  event: string, 
  details?: any, 
  startTime?: number
): void => {
  // Calculate duration if startTime is provided
  const duration = startTime ? Date.now() - startTime : undefined;
  
  // Log to console with emoji indicator via debugLog
  debugLog(component, event, details, undefined, startTime);
  
  // Add to history
  authFlowHistory.addEvent(component, event, details, duration);
};

/**
 * Dump the authentication flow history to console
 */
export const dumpAuthFlowHistory = (): void => {
  const events = authFlowHistory.getEvents();
  
  console.group('📋 Auth Flow History');
  console.log(`Total events: ${events.length}`);
  
  events.forEach((event, index) => {
    const timeString = new Date(event.timestamp).toISOString();
    const emoji = (() => {
      if (event.event.includes('error') || event.event.includes('fail')) return '❌';
      if (event.event.includes('success') || event.event.includes('complete')) return '✅';
      if (event.event.includes('start') || event.event.includes('attempt')) return '🔄';
      if (event.event.includes('warning') || event.event.includes('issue')) return '⚠️';
      return '🔍';
    })();
    
    console.group(`${index + 1}. ${emoji} [${event.component}] ${event.event} (${timeString})`);
    if (event.duration) {
      console.log(`Duration: ${event.duration}ms`);
    }
    if (event.details) {
      console.log('Details:', event.details);
    }
    console.groupEnd();
  });
  
  console.groupEnd();
};

/**
 * Check auth status across different storage mechanisms
 */
export const checkAuthStatus = async (): Promise<{
  isAuthenticated: boolean;
  sessionStatus: Record<string, boolean>;
  details: Record<string, any>;
}> => {
  const startTime = Date.now();
  trackAuthEvent('SessionMonitor', 'Starting auth status check');
  
  const result = {
    isAuthenticated: false,
    sessionStatus: {
      localStorage: false,
      secureStore: false,
      cookies: false,
      memory: false
    },
    details: {}
  };
  
  try {
    // This is a placeholder - implement the actual checks based on your auth implementation
    // For example, check if token exists in AsyncStorage, SecureStore, etc.
    
    trackAuthEvent('SessionMonitor', 'Completed auth status check', result, startTime);
    return result;
  } catch (error) {
    trackAuthEvent('SessionMonitor', 'Error in auth status check', { error }, startTime);
    return result;
  }
};

/**
 * Print detailed session debug information
 */
export const printSessionDebug = async (): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const status = await checkAuthStatus();
    
    console.group('📊 Authentication Session Debug');
    console.log('Is Authenticated:', status.isAuthenticated);
    console.log('Platform:', Platform.OS);
    
    console.group('Session Status by Storage');
    Object.entries(status.sessionStatus).forEach(([storage, exists]) => {
      console.log(`${storage}: ${exists ? '✅ Found' : '❌ Not found'}`);
    });
    console.groupEnd();
    
    console.group('Session Details');
    Object.entries(status.details).forEach(([storage, data]) => {
      console.log(`${storage}:`, data);
    });
    console.groupEnd();
    
    // Dump auth flow history
    dumpAuthFlowHistory();
    
    console.groupEnd();
    
    trackAuthEvent('SessionMonitor', 'Printed session debug info', {}, startTime);
  } catch (error) {
    const errorObj = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : { message: String(error) };
    
    trackAuthEvent('SessionMonitor', 'Error printing session debug', errorObj, startTime);
    console.error('❌ Error during session debug:', error);
  }
}; 