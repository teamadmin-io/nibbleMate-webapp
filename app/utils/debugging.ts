/**
 * Central debugging utilities for the application
 * This file provides standardized logging functions with emoji indicators and consistent formatting
 */

/**
 * Enhanced debug logger with emoji indicators and detailed formatting
 * @param category The module or component category
 * @param action The action being performed
 * @param details Optional details to include
 * @param error Optional error object if applicable
 */
export function debugLog(category: string, action: string, details?: any, error?: Error, startTime?: number) {
  const timestamp = new Date().toISOString();
  
  // Select appropriate emoji based on action type
  const emoji = (() => {
    if (action.includes('error') || action.includes('fail')) return '❌';
    if (action.includes('success') || action.includes('complete')) return '✅';
    if (action.includes('start') || action.includes('attempt')) return '🔄';
    if (action.includes('warning') || action.includes('issue')) return '⚠️';
    return '🔍';
  })();
  
  // Calculate duration if startTime provided
  const duration = startTime ? `(${Date.now() - startTime}ms)` : '';
  
  // Format the log message
  const prefix = `[${timestamp}] ${emoji} [${category}]`;
  
  if (error) {
    console.error(`${prefix} ${action} ${duration}:`, error.message || error);
    if (error.stack) console.error(error.stack);
  } else if (details !== undefined) {
    let logData;
    try {
      // Format details appropriately based on type
      if (typeof details === 'object' && details !== null) {
        if (Array.isArray(details)) {
          logData = `Array(${details.length}) - Sample: ${JSON.stringify(details.slice(0, 1))}`;
        } else {
          const stringified = JSON.stringify(details);
          logData = stringified.length > 500 ? stringified.substring(0, 500) + '...' : stringified;
        }
      } else {
        logData = String(details);
      }
    } catch (e) {
      logData = '[Complex Object]';
    }
    console.log(`${prefix} ${action} ${duration}: ${logData}`);
  } else {
    console.log(`${prefix} ${action} ${duration}`);
  }
}

/**
 * Basic logger with timestamp
 */
export function log(msg = "") {
  return console.log(new Date() + ":> " + msg);
} 