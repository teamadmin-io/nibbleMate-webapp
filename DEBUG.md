# NibbleMate Debugging Guide

This document outlines the comprehensive debugging utilities available in the NibbleMate application.

## 🚀 Available Debugging Tools

NibbleMate includes a variety of debugging tools and utilities for diagnosing issues across different platforms and modules.

### Core Debugging

- **Emoji-based Logging**: Visual indicators help quickly identify log types (✅ success, ❌ error, 🔄 in-progress, etc.)
- **Structured Formatting**: Consistent log formatting with timestamps, categories, and formatted details
- **Request Timing**: Performance timing for operations and API calls
- **Data Truncation**: Automatic truncation of large objects to avoid console clutter

### Network & API Debugging

- **Request/Response Logging**: Comprehensive logging of API requests and responses
- **Headers Inspection**: Visibility into request/response headers (with sensitive data masked)
- **Body Parsing**: Automatic parsing of request/response bodies
- **Error Diagnostics**: Detailed error information including status codes and error types
- **Content Type Detection**: Automatic detection of response content types
- **Enhanced Fetch**: Debug-enabled fetch wrapper for automatic logging
- **Connection Monitoring**: Network connectivity status tracking
- **Timeout Handling**: Automatic timeout detection for API calls

### User Authentication Debugging

- **Session Monitoring**: Track authentication state across different storage mechanisms
- **Auth Flow History**: Historical record of authentication events
- **Session Inspection**: Utilities to examine token validity and session details
- **Authentication Event Tracking**: Detailed tracking of login/logout and token refresh events

### Feature-specific Debugging

- **Cat Module** (🐱): Detailed logs for cat-related operations
- **Feeder Module** (🍽️): Debugging for feeder operations and schedules
- **Auth Module** (🔐): Authentication flow and session tracking

### Platform-specific Diagnostics

- **Web Diagnostics**: Information about browser, viewport, connectivity
- **CORS Detection**: Identify cross-origin issues on web
- **Mixed Content Detection**: Flag HTTP/HTTPS mixing issues
- **Memory Usage**: Track JS heap usage where available

## 🔍 How to Use Debugging Tools

### Basic Console Logging

The application uses enhanced console logging with emoji indicators and consistent formatting:

```typescript
import { debugLog } from './app/utils/debugging';

// Basic usage
debugLog('CategoryName', 'Event or action description');

// With additional details
debugLog('CategoryName', 'Event description', { detailKey: 'value' });

// With error information
try {
  // some code
} catch (error) {
  debugLog('CategoryName', 'Error occurred', undefined, error);
}

// With timing information
const startTime = Date.now();
// ... some operation
debugLog('CategoryName', 'Operation completed', undefined, undefined, startTime);
```

### Network Request Debugging

Instead of using fetch directly, you can use the debug-enhanced version:

```typescript
import { debugFetch } from './app/utils/api/debugFetch';

// Use like normal fetch
const response = await debugFetch('/api/endpoint', { 
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Authentication Debugging

```typescript
import { printSessionDebug } from './app/utils/features/auth/sessionMonitor';

// Dump complete session state
await printSessionDebug();
```

### System Diagnostics

```typescript
import { collectDiagnostics } from './app/utils/diagnostics';

// Get complete system information
const diagnosticInfo = await collectDiagnostics();
console.log(diagnosticInfo);
```

## Debug Constants

The application uses predefined debug constants:

```typescript
// DEBUG_PREFIXES from app/constants.ts
export const DEBUG_PREFIXES = {
  CAT: '🐱',
  AUTH: '🔐',
  FEEDER: '🍽️',
  NETWORK: '📡',
  ERROR: '❌',
  SUCCESS: '✅',
  WARNING: '⚠️',
  INFO: '🔍'
};
```

## Best Practices

1. **Use Category Names**: Always use clear category names for filtering logs
2. **Time Long Operations**: Include startTime parameter for operations that might take time
3. **Structure Data**: Pass structured objects instead of string concatenation
4. **Don't Log Sensitive Data**: Avoid passwords, tokens, and personal data
5. **Be Consistent**: Follow the established patterns for your module 