// client/src/utils/phoneUtils.js
// Small utility helpers to format phone numbers for display and tel: links.

export function formatPhoneForDisplay(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  // fallback: return original input
  return phone;
}

export function formatPhoneForTel(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `tel:+${digits}`;
  return `tel:${phone}`;
}
