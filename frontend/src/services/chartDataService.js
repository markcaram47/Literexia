// src/services/chartDataService.js
/**
 * This service handles fetching chart data from the API
 * In a real application, these functions would make actual API calls
 * For this example, we're simulating API responses
 */

// Simulated API delay
const simulateApiCall = (data) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 800);
    });
  };
  
  /**
   * Fetch activity completion data for the last 6 weeks
   */
  export const fetchActivityCompletionData = async () => {
    try {
      // In a real app, this would be an API call like:
      // const response = await fetch('/api/charts/activity-completion');
      // const data = await response.json();
      
      // Simulated data
      const data = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [
          {
            label: 'Completed',
            data: [45, 55, 70, 80, 85, 90],
            backgroundColor: '#26c485',
          },
          {
            label: 'Pending',
            data: [10, 15, 12, 10, 15, 12],
            backgroundColor: '#ffc107',
          }
        ]
      };
      
      return await simulateApiCall(data);
    } catch (error) {
      console.error('Error fetching activity completion data:', error);
      throw error;
    }
  };
  
  /**
   * Fetch weekly approval rate data
   */
  export const fetchWeeklyApprovalRateData = async () => {
    try {
      // Simulated data
      const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Rate',
            data: [75, 78, 75, 80, 95, 68, 72],
            borderColor: '#ff6384',
            fill: false,
            tension: 0.4,
          }
        ]
      };
      
      return await simulateApiCall(data);
    } catch (error) {
      console.error('Error fetching weekly approval rate data:', error);
      throw error;
    }
  };
  
  /**
   * Fetch user registration trend data
   */
  export const fetchUserRegistrationTrendData = async () => {
    try {
      // Simulated data
      const data = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: 'Teachers',
            data: [10, 15, 18, 20],
            backgroundColor: '#7e57c2',
          },
          {
            label: 'Parents',
            data: [8, 20, 25, 30],
            backgroundColor: '#4fc3f7',
          },
          {
            label: 'Students',
            data: [75, 100, 130, 190],
            backgroundColor: '#ffa726',
          },
          {
            label: 'Others',
            data: [3, 5, 4, 6],
            backgroundColor: '#ef5350',
          }
        ]
      };
      
      return await simulateApiCall(data);
    } catch (error) {
      console.error('Error fetching user registration trend data:', error);
      throw error;
    }
  };
  
  /**
   * Fetch user type distribution data
   */
  export const fetchUserTypeData = async () => {
    try {
      // Simulated data
      const data = {
        labels: ['Admin', 'Teacher', 'Students', 'Parent'],
        datasets: [
          {
            data: [0.5, 33.3, 33.3, 33.3],
            backgroundColor: ['#4285f4', '#4285f4', '#db4437', '#f4b400'],
          }
        ]
      };
      
      return await simulateApiCall(data);
    } catch (error) {
      console.error('Error fetching user type data:', error);
      throw error;
    }
  };
  
  /**
   * Fetch user status distribution data
   */
  export const fetchUserStatusData = async () => {
    try {
      // Simulated data
      const data = {
        labels: ['Active', 'Pending', 'Inactive'],
        datasets: [
          {
            data: [85, 8, 7],
            backgroundColor: ['#26c485', '#f4b400', '#ef5350'],
          }
        ]
      };
      
      return await simulateApiCall(data);
    } catch (error) {
      console.error('Error fetching user status data:', error);
      throw error;
    }
  };