/**
 * Centralized debugging module for NibbleMate
 * Provides standardized logging with emoji indicators and performance metrics
 */

import { DEBUG_ENABLED, DEBUG_PREFIXES } from './constants';

/**
 * Debug log function with consistent formatting and optional timing
 * 
 * @param category - Category for the log (e.g., 'API', 'Auth')
 * @param message - Primary log message
 * @param details - Optional details object to include
 * @param error - Optional error object to log
 * @param startTime - Optional start time in milliseconds to calculate duration
 */
export const debugLog = (
  category: string, 
  message: string, 
  details?: any, 
  error?: Error, 
  startTime?: number
): void => {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category}]`;
  
  // Calculate duration if startTime provided
  const durationStr = startTime ? ` (${Date.now() - startTime}ms)` : '';
  
  if (error) {
    console.error(`${prefix} ❌ ${message}${durationStr}:`, error.message);
    if (error.stack) console.error(error.stack);
  } 
  else if (details !== undefined) {
    // Sanitize details for logging
    const safeDetails = sanitizeObjectForLogging(details);
    console.log(`${prefix} ✅ ${message}${durationStr}:`, safeDetails);
  } 
  else {
    console.log(`${prefix} 🔄 ${message}${durationStr}`);
  }
};

/**
 * Sanitize an object for logging by removing sensitive data 
 * and truncating large arrays/objects
 */
function sanitizeObjectForLogging(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Handle primitive types
  if (typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length > 10) {
      return [...obj.slice(0, 10), `... and ${obj.length - 10} more items`];
    }
    return obj.map(sanitizeObjectForLogging);
  }
  
  // Handle objects
  const safeObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Mask sensitive fields
    if (/password|token|key|secret|auth/i.test(key)) {
      if (typeof value === 'string' && value.length > 0) {
        safeObj[key] = value.substring(0, 4) + '****';
      } else {
        safeObj[key] = '[REDACTED]';
      }
    } 
    // Truncate large text values
    else if (typeof value === 'string' && value.length > 500) {
      safeObj[key] = value.substring(0, 500) + ` ... (${value.length - 500} more characters)`;
    }
    // Recursively sanitize nested objects
    else if (typeof value === 'object' && value !== null) {
      safeObj[key] = sanitizeObjectForLogging(value);
    }
    // Pass through other values
    else {
      safeObj[key] = value;
    }
  }
  
  return safeObj;
}

/**
 * Track group of related debug logs
 */
export class DebugTracker {
  private startTime: number;
  private checkpoints: Array<{ name: string, time: number }> = [];
  private category: string;
  
  constructor(category: string, initialMessage?: string) {
    this.startTime = Date.now();
    this.category = category;
    
    if (initialMessage) {
      debugLog(category, initialMessage);
    }
  }
  
  /**
   * Add a checkpoint with timing information
   */
  checkpoint(message: string, details?: any): void {
    const now = Date.now();
    const elapsed = now - this.startTime;
    this.checkpoints.push({ name: message, time: elapsed });
    
    debugLog(this.category, `${message} (${elapsed}ms)`, details);
  }
  
  /**
   * Complete the tracking with a final message
   */
  complete(message: string, details?: any): void {
    const totalTime = Date.now() - this.startTime;
    
    const checkpointInfo = this.checkpoints.map(cp => 
      `${cp.name}: ${cp.time}ms`
    ).join(', ');
    
    debugLog(
      this.category, 
      `${message} - Complete in ${totalTime}ms`, 
      { 
        ...details, 
        _timing: {
          total: totalTime,
          checkpoints: this.checkpoints
        }
      }
    );
  }
  
  /**
   * Log an error with timing information
   */
  error(message: string, error: Error): void {
    const totalTime = Date.now() - this.startTime;
    debugLog(this.category, `${message} (after ${totalTime}ms)`, undefined, error);
  }
} 