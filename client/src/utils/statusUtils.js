// client/src/utils/statusUtils.js
// Utility functions for normalizing and formatting order statuses

// Normalize status to lowercase string
export function normalizeStatus(status) {
  if (!status) return 'pending';
  return String(status).toLowerCase();
}

// Format status for display
export function formatStatus(status) {
  const s = normalizeStatus(status);
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

// Get CSS class based on status
export function statusClass(status) {
  return normalizeStatus(status);
}
