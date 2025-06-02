import React from 'react';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';

const ErrorMessage = ({ message = 'An error occurred', retry = null }) => {
  return (
    <div className="error-container">
      <div className="error-icon">
        <FaExclamationTriangle />
      </div>
      <h2 className="error-title">Something went wrong</h2>
      <p className="error-message">{message}</p>
      {retry && (
        <button className="retry-button" onClick={retry}>
          <FaSync /> Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;