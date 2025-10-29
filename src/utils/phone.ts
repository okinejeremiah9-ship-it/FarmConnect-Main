export const normalizeGhanaPhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  if (digitsOnly.startsWith('0')) {
    return `+233${digitsOnly.substring(1)}`;
  }

  if (digitsOnly.startsWith('233')) {
    return `+${digitsOnly}`;
  }

  if (phone.startsWith('+233')) {
    return phone;
  }

  return `+233${digitsOnly}`;
};

export const isValidGhanaPhoneNumber = (phone: string): boolean => {
  const normalized = normalizeGhanaPhoneNumber(phone);
  return /^\+233\d{9}$/.test(normalized);
};
