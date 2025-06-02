import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
    baseURL: `${API_URL}/dashboard`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
);

export const adminDashboardService = {
    getDashboardStats: async () => {
        try {
            console.log('Fetching dashboard stats...');
            const response = await axiosInstance.get('/stats');
            console.log('Dashboard response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }
}; 