import { Feeder, ScheduleData, FoodBrand } from './types';
import { getSession } from '../auth/api';
import { debugLog } from '../../../debugging';
import { API_URL } from '../../../constants';

// Feeder-specific debugging
const DEBUG_PREFIX = '🍽️';
const feederDebug = (action: string, details?: any, error?: Error, startTime?: number) => {
  debugLog(`${DEBUG_PREFIX} API`, action, details, error, startTime);
};

export const fetchFoodBrands = async (): Promise<FoodBrand[]> => {
  feederDebug('Attempting to fetch food brands');
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session?.access_token) {
      feederDebug('Authentication error', { error: 'No access token available' });
      throw new Error('No authenticated user');
    }

    feederDebug('Making GET request', { endpoint: `${API_URL}/feeders/foodbrands` });
    
    const response = await fetch(`${API_URL}/feeders/foodbrands`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    
    if (!response.ok) {
      const error = new Error('Failed to fetch food brands');
      feederDebug('Request failed', { status: response.status, statusText: response.statusText }, error, startTime);
      throw error;
    }
    
    const data = await response.json();
    feederDebug('Successfully fetched food brands', { count: data.length }, undefined, startTime);
    return data;
  } catch (error) {
    feederDebug('Error fetching food brands', undefined, error instanceof Error ? error : new Error(String(error)), startTime);
    throw error;
  }
};

export const fetchUserFeeders = async (): Promise<Feeder[]> => {
  feederDebug('Attempting to fetch feeders');
  const startTime = Date.now();
  
  try {
    const session = await getSession();
    if (!session?.access_token) {
      feederDebug('Authentication error', { error: 'No access token available' });
      throw new Error('No authenticated user');
    }
    
    feederDebug('Making GET request', { endpoint: `${API_URL}/feeders` });
    
    // Make request with standard headers
    const response = await fetch(`${API_URL}/feeders`, {
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Accept': 'application/json'
      },
    });
    
    // Enhanced error handling with status code information
    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = `Failed to fetch feeders (HTTP ${statusCode})`;
      
      // Check for HTML error pages
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const isHtml = contentType.includes('text/html');
      
      feederDebug('Response content type', { contentType, isJson, isHtml });
      
      try {
        const responseText = await response.text();
        
        // If the server returned HTML, don't try to parse it as JSON
        if (isHtml) {
          feederDebug('Server returned HTML instead of JSON', { status: statusCode });
          errorMessage = `Server returned HTML instead of JSON (HTTP ${statusCode})`;
          
          // Log the first 100 chars of HTML for debugging
          if (responseText.length > 0) {
            feederDebug('HTML response start', { preview: responseText.substring(0, 100) + '...' });
          }
        } else if (isJson && responseText) {
          // Try to parse JSON response
          try {
            const errorJson = JSON.parse(responseText);
            if (errorJson.detail) {
              errorMessage += `: ${errorJson.detail}`;
            }
          } catch (parseError) {
            feederDebug('Failed to parse JSON error response', undefined, parseError instanceof Error ? parseError : undefined);
            errorMessage += `: ${responseText.substring(0, 100)}`;
          }
        } else {
          // Plain text or unknown format
          errorMessage += `: ${responseText.substring(0, 100)}`;
        }
      } catch (e) {
        feederDebug('Could not read error response', undefined, e instanceof Error ? e : undefined);
      }
      
      const error = new Error(errorMessage);
      feederDebug('Request failed', { status: response.status, errorMessage }, error, startTime);
      throw error;
    }
    
    // Parse the response as JSON with better error handling
    let data;
    try {
      const text = await response.text();
      if (!text) {
        feederDebug('Empty response body');
        data = [];
      } else {
        data = JSON.parse(text);
        if (!Array.isArray(data)) {
          feederDebug('Response is not an array, wrapping it', data);
          data = [data]; // Wrap non-array responses
        }
      }
    } catch (parseError) {
      feederDebug('JSON parse error', undefined, parseError instanceof Error ? parseError : undefined);
      throw new Error(`Failed to parse server response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    feederDebug('Successfully fetched feeders', { count: data.length || 0 }, undefined, startTime);
    return data;
  } catch (error) {
    feederDebug('Error fetching feeders', undefined, error instanceof Error ? error : new Error(String(error)), startTime);
    throw error;
  }
};

export const createFeeder = async (foodBrand: string, suggestedName?: string): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  try {
    // First get the food brands to find the ID for the given brand name
    console.log('Fetching food brands to find ID for:', foodBrand);
    const foodBrands = await fetchFoodBrands();
    console.log('Available food brands:', foodBrands.map(b => b.brandName).join(', '));
    
    const selectedBrand = foodBrands.find(brand => brand.brandName === foodBrand);
    console.log('Selected brand:', selectedBrand);
    
    if (!selectedBrand) {
      console.error(`Food brand "${foodBrand}" not found in available brands`);
      throw new Error(`Food brand "${foodBrand}" not found`);
    }
    
    // Use the suggestedName if provided, otherwise use the default format
    const feederName = suggestedName || `My ${foodBrand} Feeder`;
    
    // Create request body with both required fields
    const requestBody = { 
      foodbrand_id: selectedBrand.id, 
      name: feederName 
    };
    
    console.log('Sending request with body:', JSON.stringify(requestBody));
    
    const response = await fetch(`${API_URL}/feeders`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from server:', errorText);
      feederDebug('Create feeder failed', { status: response.status, error: errorText });
      
      try {
        // Try to parse error as JSON
        const errorJson = JSON.parse(errorText);
        
        // Check for specific error types
        if (errorJson.detail && typeof errorJson.detail === 'string') {
          if (errorJson.detail.includes('row-level security policy')) {
            throw new Error('Permission denied: This violates row-level security policy for feeder table');
          } else if (errorJson.detail.includes('Database error')) {
            throw new Error(errorJson.detail);
          }
          throw new Error(errorJson.detail);
        }
      } catch (parseError) {
        // If parsing fails, use the original error text
      }
      
      throw new Error('Failed to create feeder');
    }
    
    feederDebug('Successfully created feeder', { foodBrand });
  } catch (error) {
    console.error('Error in createFeeder:', error);
    feederDebug('Error creating feeder', undefined, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const linkFeeder = async (feederId: number, hardwareId?: string): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Linking feeder ID: ${feederId} with hardware ID: ${hardwareId}`);
  console.log(`POST data: ${JSON.stringify({ feederId, hardwareId })}`);
  
  try {
    const response = await fetch(`${API_URL}/feeders/link`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feederId, hardwareId }),
    });
    
    console.log(`Link feeder response status: ${response.status}`);
    
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
      
      throw new Error(`Failed to link feeder: ${errorText}`);
    }
    
    console.log('Link feeder successful');
  } catch (error) {
    console.error('Error in linkFeeder:', error);
    throw error;
  }
};

export const fetchAvailableFeeders = async (): Promise<Feeder[]> => {
  feederDebug('Attempting to fetch available feeders');
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session?.access_token) {
      feederDebug('Authentication error', { error: 'No access token available' });
      throw new Error('No authenticated user');
    }
    
    // Since /feeders/available endpoint returns 405, use the main /feeders endpoint that works
    feederDebug('Making GET request', { endpoint: `${API_URL}/feeders` });
    
    const response = await fetch(`${API_URL}/feeders`, {
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Accept': 'application/json'
      },
    });
    
    if (!response.ok) {
      const error = new Error('Failed to fetch available feeders');
      feederDebug('Request failed', { status: response.status, statusText: response.statusText }, error, startTime);
      throw error;
    }
    
    const data = await response.json();
    
    // Filter out feeders that already have a hardware ID to get "available" ones
    const availableFeeders = Array.isArray(data) ? data.filter(feeder => !feeder.hardwareid) : [];
    
    feederDebug('Successfully fetched available feeders', { count: availableFeeders.length }, undefined, startTime);
    return availableFeeders;
  } catch (error) {
    feederDebug('Error fetching available feeders', undefined, error instanceof Error ? error : new Error(String(error)), startTime);
    throw error;
  }
};

export const fetchFeederSchedule = async (feederId: string | number): Promise<{ scheduleId: number | null, scheduleData: ScheduleData | null, quantity: number }> => {
  feederDebug('Attempting to fetch feeder schedule', { feederId });
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session?.access_token) {
      feederDebug('Authentication error', { error: 'No access token available' });
      throw new Error('No authenticated user');
    }

    feederDebug('Making GET request', { endpoint: `${API_URL}/schedule/${feederId}` });
    
    const response = await fetch(`${API_URL}/schedule/${feederId}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch schedule';
      
      // Handle specific status codes
      if (response.status === 405) {
        errorMessage = 'Schedule API endpoint not available (Method Not Allowed)';
      } else if (response.status === 404) {
        errorMessage = 'Schedule endpoint not found';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Not authorized to access this schedule';
      }
      
      try {
        // Try to get more detailed error from response body
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMessage = `${errorMessage}: ${errorData.detail}`;
        }
      } catch (e) {
        // If we can't parse the JSON, just use the status text
        if (response.statusText) {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
      }
      
      const error = new Error(errorMessage);
      feederDebug('Request failed', { status: response.status, statusText: response.statusText }, error, startTime);
      throw error;
    }
    
    const data = await response.json();
    feederDebug('Successfully fetched schedule', data, undefined, startTime);
    return {
      scheduleId: data.scheduleId,
      scheduleData: data.scheduleData,
      quantity: data.quantity || 100.0 // Default to 100 if not provided
    };
  } catch (error) {
    feederDebug('Error fetching feeder schedule', undefined, error instanceof Error ? error : new Error(String(error)), startTime);
    throw error;
  }
};

export const saveFeederSchedule = async (
  feederId: string | number,
  scheduleId: number | null,
  scheduleData: ScheduleData,
  quantity: number = 100.0
): Promise<number> => {
  feederDebug('Attempting to save feeder schedule', { feederId, scheduleId, quantity });
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session?.access_token) {
      feederDebug('Authentication error', { error: 'No access token available' });
      throw new Error('No authenticated user');
    }

    feederDebug('Making POST request', { endpoint: `${API_URL}/schedule/${feederId}` });
    
    const response = await fetch(`${API_URL}/schedule/${feederId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scheduleId,
        scheduleData,
        quantity
      })
    });
    
    if (!response.ok) {
      const error = new Error('Failed to save schedule');
      feederDebug('Request failed', { status: response.status, statusText: response.statusText }, error, startTime);
      throw error;
    }
    
    const data = await response.json();
    const newScheduleId = data.scheduleId;
    
    feederDebug('Successfully saved schedule', { scheduleId: newScheduleId }, undefined, startTime);
    return newScheduleId;
  } catch (error) {
    feederDebug('Error saving feeder schedule', undefined, error instanceof Error ? error : new Error(String(error)), startTime);
    throw error;
  }
};

export const triggerFeedNow = async (feederId: string | number, calories?: number): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  const response = await fetch(`${API_URL}/feednow`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feederId, calories }),
  });
  if (!response.ok) throw new Error('Failed to trigger feed now');
};

export const assignHardwareId = async (feederId: number, hardwareId: string): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Assigning hardware ID ${hardwareId} to feeder ${feederId}`);
  
  try {
    const response = await fetch(`${API_URL}/feeders/hardware`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feederId, hardwareId }),
    });
    
    console.log(`Hardware ID assignment response status: ${response.status}`);
    
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
      
      throw new Error(`Failed to assign hardware ID: ${errorText}`);
    }
    
    console.log('Hardware ID assignment successful');
  } catch (error) {
    console.error('Error in assignHardwareId:', error);
    throw error;
  }
};

export const updateFeederName = async (feederId: number, name: string): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Updating feeder ${feederId} name to "${name}"`);
  
  try {
    const response = await fetch(`${API_URL}/feeders/${feederId}/name`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name }),
    });
    
    console.log(`Update feeder name response status: ${response.status}`);
    
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
      
      throw new Error(`Failed to update feeder name: ${errorText}`);
    }
    
    console.log('Feeder name update successful');
  } catch (error) {
    console.error('Error in updateFeederName:', error);
    throw error;
  }
};

export const deleteFeeder = async (feederId: number): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Deleting feeder ${feederId}`);
  
  try {
    // Use the disassociate endpoint which is implemented as PATCH
    const response = await fetch(`${API_URL}/feeders/${feederId}/disassociate`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    console.log(`Delete feeder response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Server error response: ${errorText}`);
      throw new Error(`Failed to delete feeder: ${errorText || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Feeder deletion successful:', result);
  } catch (error) {
    console.error(`Error deleting feeder ${feederId}:`, error);
    throw error;
  }
};

/**
 * Unassign all cats from a feeder by setting their feederid to null
 * @param feederId - The ID of the feeder to unassign cats from
 * @returns A promise that resolves to an object with information about the unassigned cats
 */
export const unassignCatsFromFeeder = async (feederId: number): Promise<{ cats: Array<{ catid: number, catname: string }> }> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Unassigning cats from feeder ${feederId}`);
  
  try {
    // Use the existing disassociate endpoint with PATCH method
    const response = await fetch(`${API_URL}/feeders/${feederId}/disassociate`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    console.log(`Disassociate response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Server error response: ${errorText}`);
      throw new Error(`Failed to unassign cats: ${errorText || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Unassign cats successful:', result);
    
    // Return the cats that were affected by the disassociation
    return { 
      cats: result.affected_cats || [] 
    };
  } catch (error) {
    console.error(`Error unassigning cats from feeder ${feederId}:`, error);
    throw error;
  }
};

export const updateFeederFeedAmount = async (feederId: number, calories: number): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Updating feeder ${feederId} feed amount to ${calories} calories`);
  
  try {
    const response = await fetch(`${API_URL}/feeders/${feederId}/feed-amount`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ calories }),
    });
    
    console.log(`Update feed amount response status: ${response.status}`);
    
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
      
      throw new Error(`Failed to update feed amount: ${errorText}`);
    }
    
    console.log('Feed amount update successful');
  } catch (error) {
    console.error('Error in updateFeederFeedAmount:', error);
    throw error;
  }
};

export const updateFeederFoodBrand = async (feederId: number, brandName: string): Promise<void> => {
  const session = await getSession();
  if (!session?.access_token) throw new Error('No authenticated user');
  
  console.log(`Updating feeder ${feederId} food brand to "${brandName}"`);
  
  try {
    const response = await fetch(`${API_URL}/feeders/${feederId}/food-brand`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ brandName }),
    });
    
    console.log(`Update food brand response status: ${response.status}`);
    
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
      
      throw new Error(`Failed to update food brand: ${errorText}`);
    }
    
    console.log('Food brand update successful');
  } catch (error) {
    console.error('Error in updateFeederFoodBrand:', error);
    throw error;
  }
};