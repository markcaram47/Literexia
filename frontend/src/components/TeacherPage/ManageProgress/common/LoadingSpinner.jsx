import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', overlay = false }) => {
  if (overlay) {
    return (
      <div className="loading-spinner-overlay">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-message">{message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;