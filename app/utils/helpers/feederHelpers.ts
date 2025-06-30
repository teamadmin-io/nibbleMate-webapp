/**
 * Helper functions for feeder-related operations
 */

/**
 * Validates and formats a hardware ID (MAC address)
 * Returns null if invalid or the formatted hardware ID if valid
 */
export const validateHardwareId = (input: string): string | null => {
  if (!input) return null;
  
  // Remove any delimiters (colons, hyphens, periods, spaces, underscores)
  const stripped = input.replace(/[:\-\.\s_]/g, '');
  
  // Check if it's a valid 12-character hex value
  if (/^[0-9A-Fa-f]{12}$/.test(stripped)) {
    return stripped.toUpperCase();
  }
  
  return null;
};

/**
 * Formats a hardware ID for display (adds hyphens for readability)
 */
export const formatHardwareIdForDisplay = (hardwareId: string): string => {
  if (!hardwareId) return '';
  
  // Add hyphens every two characters
  return hardwareId.match(/.{1,2}/g)?.join('-') || hardwareId;
};

interface Feeder {
  id: number;
  name?: string | null;
  foodbrand?: string | null;
  [key: string]: any;
}

/**
 * Gets a consistent display name for a feeder across the entire app.
 * Named feeders keep their names, unnamed feeders are numbered sequentially after named ones.
 * @param feeder The feeder to get the display name for
 * @param allFeeders All feeders in the system, needed for consistent numbering
 * @param includeFood Whether to include the food brand in the display name
 * @returns The display name for the feeder
 */
export const getFeederDisplayName = (
  feeder: Feeder,
  allFeeders: Feeder[],
  includeFood: boolean = true
): string => {
  if (!feeder) return '';
  
  // If feeder has a name, use it
  if (feeder.name) {
    return includeFood && feeder.foodbrand 
      ? `${feeder.name} - ${feeder.foodbrand}`
      : feeder.name;
  }
  
  // Sort all unnamed feeders by ID for consistent ordering
  const unnamedFeeders = allFeeders
    .filter(f => !f.name)
    .sort((a, b) => a.id - b.id);
    
  // Get the number of named feeders
  const namedCount = allFeeders.filter(f => f.name).length;
  
  // Find this feeder's position in the unnamed list
  const unnamedIndex = unnamedFeeders.findIndex(f => f.id === feeder.id);
  
  // Generate the base name (Feeder n)
  const baseName = `Feeder ${namedCount + unnamedIndex + 1}`;
  
  // Add food brand if requested
  return includeFood && feeder.foodbrand 
    ? `${baseName} - ${feeder.foodbrand}`
    : baseName;
}; 