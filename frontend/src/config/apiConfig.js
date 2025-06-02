// API configuration for the application
const isProd = import.meta.env?.PROD || false;
const API_BASE = import.meta.env?.VITE_API_URL || (isProd ? '' : 'http://localhost:5001');
const API_URL = `${API_BASE}/api`;

export default API_URL; 