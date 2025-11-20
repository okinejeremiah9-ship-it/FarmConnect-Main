// -------------------------------------------------------
// Normalize any Ghana number into strict: 0XXXXXXXXX
// -------------------------------------------------------
export const normalizeGhanaPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  // Case: +233XXXXXXXXX → 0XXXXXXXXX
  if (phone.startsWith("+233") && digits.length === 12) {
    return "0" + digits.slice(3);
  }

  // Case: 233XXXXXXXXX → 0XXXXXXXXX
  if (digits.length === 12 && digits.startsWith("233")) {
    return "0" + digits.slice(3);
  }

  // Case: 0XXXXXXXXX (already correct)
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits;
  }

  // Case: 9 digits (missing leading zero)
  if (digits.length === 9) {
    return "0" + digits;
  }

  // Fallback — enforce last 9 digits prefixed with 0
  return "0" + digits.slice(-9);
};

// -------------------------------------------------------
// Validate strictly: 0XXXXXXXXX (10 digits, starts with 0)
// -------------------------------------------------------
export const isValidGhanaPhoneNumber = (phone: string): boolean => {
  const normalized = normalizeGhanaPhoneNumber(phone);
  return /^0\d{9}$/.test(normalized);
};
