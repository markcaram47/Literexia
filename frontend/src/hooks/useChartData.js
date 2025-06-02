// src/hooks/useChartData.js
import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch chart data
 * @param {Function} fetchFunction - Function that fetches the chart data
 * @param {Array} dependencies - Array of dependencies for the useEffect hook
 * @returns {Object} - Object containing the data, loading state, and error
 */
const useChartData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchFunction();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching data');
        console.error('Error in useChartData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

export default useChartData;