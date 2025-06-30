import { getSession } from '../auth/api';
import { CatHistoryResponse, DataPeriod, DataType } from './types';
import { API_URL } from '../../../constants';

// Cat-specific debugging
const DEBUG_PREFIX = '🐱';
const apiDebug = (action: string, details?: any, error?: Error, startTime?: number) => {
  console.log(`${DEBUG_PREFIX} API ${action}`, details, error, startTime ? `Time: ${Date.now() - startTime}ms` : '');
};

export const fetchAllCats = async () => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log('Fetching cats with token:', session.access_token.substring(0, 10) + '...');
  
  try {
    const response = await fetch(`${API_URL}/cats`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    
    console.log('Cats API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching cats:', errorText);
      throw new Error(`Failed to fetch cats: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Cats data received:', JSON.stringify(data));
    console.log('Number of cats returned:', Array.isArray(data) ? data.length : 'Not an array');
    
    return data;
  } catch (error) {
    console.error('Exception in fetchAllCats:', error);
    throw error;
  }
};

export const fetchCatById = async (catid: string | number) => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  const response = await fetch(`${API_URL}/cats/${catid}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch cat');
  return await response.json();
};

export const fetchCatHistory = async (
  catid: string | number,
  period: DataPeriod = 'week',
  dataType: DataType | 'all' = 'all',
  startDate?: string,
  endDate?: string
): Promise<CatHistoryResponse> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  // Map frontend data types to backend expected values
  let dataTypeParam: string;
  if (dataType === 'feed') {
    dataTypeParam = 'amount';  // Convert 'feed' to 'amount' for the backend
  } else {
    dataTypeParam = dataType;  // 'weight' or 'all' remain the same
  }
  
  let url = `${API_URL}/cats/${catid}/history?period=${period}&data_type=${dataTypeParam}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  
  if (!response.ok) throw new Error('Failed to fetch cat history');
  return await response.json();
};

export const createCat = async (catData: any) => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');

  // Log the incoming data
  console.log('Original form data:', JSON.stringify(catData, null, 2));

  // Ensure catbreed and catsex are strings, not objects or other types
  const catbreed = typeof catData.catbreed === 'string' ? catData.catbreed : String(catData.catbreed || '');
  const catsex = typeof catData.catsex === 'string' ? catData.catsex : String(catData.catsex || '');
  
  // Create properly formatted data - all strings for text fields
  const formattedData = {
    catname: typeof catData.catname === 'string' ? catData.catname : 'TestCat',
    catbreed: catbreed || 'Unknown',
    feederid: catData.feederid || 25,
    // No string conversion for numeric fields - server now handles this properly
    catage: catData.catage || 3,
    catweight: catData.catweight || 5.5,
    catlength: catData.catlength || 10.0,
    catsex: catsex || 'Male'
  };

  // Log the formatted data
  console.log('Sending formatted data:', JSON.stringify(formattedData, null, 2));

  try {
    // Make the request
    const response = await fetch(`${API_URL}/cats`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedData),
    });
    
    // Log the response status
    console.log('Response status:', response.status, response.statusText);
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    if (!response.ok) {
      let errorDetail = 'Failed to create cat';
      try {
        if (responseText) {
          const error = JSON.parse(responseText);
          errorDetail = error.detail || errorDetail;
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      
      throw new Error(errorDetail);
    }
    
    // Parse the response
    let result;
    try {
      if (responseText) {
        result = JSON.parse(responseText);
      }
    } catch (e) {
      console.error('Error parsing success response:', e);
      result = { success: true };
    }
    
    console.log('Success creating cat:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error in createCat:', error);
    throw error;
  }
};

export const updateCat = async (catid: string | number, catData: any) => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  const response = await fetch(`${API_URL}/cats/${catid}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(catData),
  });
  if (!response.ok) throw new Error('Failed to update cat');
  return await response.json();
};

export const disassociateCat = async (catid: string | number): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Disassociating cat ${catid} from user`);
  
  try {
    const response = await fetch(`${API_URL}/cats/${catid}/disassociate`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    console.log(`Disassociate cat response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Server error response: ${errorText}`);
      
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          throw new Error(`Server error: ${errorJson.detail}`);
        }
      } catch (parseError) {
        // If not JSON or doesn't have detail field, use the raw text
      }
      
      throw new Error(`Failed to disassociate cat: ${errorText}`);
    }
    
    console.log('Cat disassociation successful');
  } catch (error) {
    console.error('Error in disassociateCat:', error);
    throw error;
  }
};

/**
 * Debug function specifically for the /cats endpoint
 * This captures extensive details about the request and response
 */
export const debugCatsEndpoint = async (): Promise<{
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    timestamp: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    bodyType: 'json' | 'html' | 'text' | 'binary';
    parsedJson?: any;
    timestamp: string;
  } | null;
  error?: {
    message: string;
    stack: string;
    timestamp: string;
  };
  timings: {
    started: string;
    completed: string;
    durationMs: number;
  };
}> => {
  console.log(`🔬 [DEEP DEBUG] Starting detailed /cats endpoint debug`);
  
  const startTime = Date.now();
  const result: {
    request: {
      url: string;
      method: string;
      headers: Record<string, string>;
      timestamp: string;
    };
    response: any;
    error?: {
      message: string;
      stack: string;
      timestamp: string;
    };
    timings: {
      started: string;
      completed: string;
      durationMs: number;
    };
  } = {
    request: {
      url: `${API_URL}/cats`,
      method: 'GET',
      headers: {},
      timestamp: new Date().toISOString()
    },
    response: null,
    timings: {
      started: new Date().toISOString(),
      completed: '',
      durationMs: 0
    }
  };
  
  try {
    // Get authentication token
    const session = await getSession();
    if (!session?.access_token) {
      throw new Error('No auth session available');
    }
    
    // Prepare headers with maximum detail
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.access_token}`,
      'Accept': 'application/json',
      'X-Debug': 'true',
      'X-Client-Version': '1.0.0',
      'X-Request-ID': `debug-${Date.now()}`
    };
    
    // Store headers for logging
    result.request.headers = { ...headers };
    
    apiDebug('Making GET request', { 
      url: `${API_URL}/cats`,
      headers: { ...headers, Authorization: `Bearer ${session.access_token.substring(0, 15)}...` }
    });
    
    // Make the request with full details
    const response = await fetch(`${API_URL}/cats`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    // Calculate timing
    const endTime = Date.now();
    result.timings.completed = new Date().toISOString();
    result.timings.durationMs = endTime - startTime;
    
    // Log response metadata immediately
    apiDebug('Response received', { 
      status: response.status, 
      statusText: response.statusText,
      durationMs: result.timings.durationMs
    });
    
    // Capture response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      responseHeaders[key] = value;
      apiDebug('Response header', { [key]: value });
    });
    
    // Clone the response to read the body
    const clonedResponse = response.clone();
    
    // Try to read the body text
    const bodyText = await clonedResponse.text();
    let bodyType: 'json' | 'html' | 'text' | 'binary' = 'text';
    let parsedJson = undefined;
    
    // Determine body type
    if (bodyText.trim().startsWith('<')) {
      bodyType = 'html';
      apiDebug('Body appears to be HTML', { size: bodyText.length });
    } else if (bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
      bodyType = 'json';
      apiDebug('Body appears to be JSON', { size: bodyText.length });
      try {
        parsedJson = JSON.parse(bodyText);
        apiDebug('Successfully parsed JSON', parsedJson);
      } catch (e) {
        apiDebug('Failed to parse JSON body', undefined, e instanceof Error ? e : new Error(String(e)));
      }
    } else if (bodyText.length > 0) {
      apiDebug('Body appears to be plain text', { size: bodyText.length });
    } else {
      apiDebug('Body is empty');
    }
    
    // Store all response details
    result.response = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: bodyText,
      bodyType,
      parsedJson,
      timestamp: new Date().toISOString()
    };
    
    // Final summary log
    apiDebug('Complete debug info captured for /cats endpoint');
    
    return result;
  } catch (error) {
    // Handle and log any errors
    const errorObj = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : { message: String(error) };
    
    apiDebug('Error during debug', errorObj, error instanceof Error ? error : undefined);
    
    const endTime = Date.now();
    result.timings.completed = new Date().toISOString();
    result.timings.durationMs = endTime - startTime;
    
    result.error = {
      message: errorObj.message,
      stack: errorObj.stack || '',
      timestamp: new Date().toISOString()
    };
    
    return result;
  }
};