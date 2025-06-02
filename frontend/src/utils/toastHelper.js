// Temporary workaround for react-hot-toast
const toastFn = (message, options = {}) => {
  console.log('Toast:', message);
  // Show message
  if (typeof window !== 'undefined') {
    alert(message);
  }
  return 'toast-id';
};

toastFn.success = (message, options = {}) => {
  console.log('Success:', message);
  // Show success message
  if (typeof window !== 'undefined') {
    alert('Success: ' + message);
  }
  return 'toast-id';
};

toastFn.error = (message, options = {}) => {
  console.error('Error:', message);
  // Show error message
  if (typeof window !== 'undefined') {
    alert('Error: ' + message);
  }
  return 'toast-id';
};

toastFn.loading = (message, options = {}) => {
  console.log('Loading:', message);
  // For loading, we'll just log to console in this fallback
  if (typeof window !== 'undefined' && options.showAlert !== false) {
    alert('Loading: ' + message);
  }
  return 'toast-id';
};

toastFn.dismiss = (id) => {
  console.log('Dismissed toast:', id);
};

export const toast = toastFn; 