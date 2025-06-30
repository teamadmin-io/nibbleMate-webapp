/**
 * Type declarations for the debugging module
 */

/**
 * Enhanced debug logger with emoji indicators
 */
export function debugLog(
  category: string, 
  action: string, 
  details?: any, 
  error?: Error, 
  startTime?: number
): void;

/**
 * Basic logger with timestamp
 */
export function log(msg?: string): void; 