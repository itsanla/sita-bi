export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('+628')) {
    return cleaned;
  } else if (cleaned.startsWith('628')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('08')) {
    return '+628' + cleaned.substring(2);
  }
  
  return cleaned;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return /^(\+628|628|08)\d{8,12}$/.test(cleaned);
};

export const formatPhoneForDisplay = (phone: string): string => {
  if (phone.startsWith('+628')) {
    return '08' + phone.substring(4);
  }
  return phone;
};