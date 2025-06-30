/**
 * Formats a date string into MM/DD format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};
  
/**
 * Extracts date portion from ISO or custom datetime string
 */
export const extractDateFromTimestamp = (timestamp: string): string => {
  try {
    if (timestamp.includes('T')) {
      return timestamp.split('T')[0];
    } else {
      return timestamp.split(' ')[0];
    }
  } catch (error) {
    console.error('Error extracting date from timestamp:', error);
    return new Date().toISOString().split('T')[0]; // Return today's date as fallback
  }
};
  
/**
 * Formats a date for display in a readable format
 */
export const formatDisplayDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting display date:', error);
    return 'Invalid Date';
  }
};