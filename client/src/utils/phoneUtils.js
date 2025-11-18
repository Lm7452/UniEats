// client/src/utils/phoneUtils.js
// Small utility helpers to format phone numbers for display and tel: links.

// Format phone number for display in (123) 456-7890 or +1 (123) 456-7890 format
export function formatPhoneForDisplay(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  return phone;
}

// Format phone number for tel: links
export function formatPhoneForTel(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `tel:+${digits}`;
  return `tel:${phone}`;
}
