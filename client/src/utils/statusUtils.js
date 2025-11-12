// client/src/utils/statusUtils.js
export function normalizeStatus(status) {
  if (!status) return 'pending';
  return String(status).toLowerCase();
}

export function formatStatus(status) {
  const s = normalizeStatus(status);
  // Map known tokens to nicer display text
  const map = {
    'pending': 'Pending',
    'claimed': 'Claimed',
    'picked_up': 'Picked Up',
    'en_route': 'En Route',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  return map[s] || s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function statusClass(status) {
  // classes in CSS use the raw token (e.g., 'picked_up', 'en_route')
  return normalizeStatus(status);
}
