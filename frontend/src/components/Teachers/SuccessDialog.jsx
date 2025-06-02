import React, { useEffect } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import '../../css/Teachers/SuccessDialog.css';

const SuccessDialog = ({ isOpen, onClose, title = 'Success', message, submessage }) => {
  // Close dialog when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    // Prevent scrolling of the background when dialog is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="success-dialog-overlay" onClick={onClose}>
      <div className="success-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="success-dialog-header">
          <span className="icon"><FaCheckCircle /></span>
          <h2>{title}</h2>
        </div>
        <div className="success-dialog-content">
          <p>{message}</p>
          {submessage && <p>{submessage}</p>}
        </div>
        <div className="success-dialog-footer">
          <button className="success-dialog-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessDialog; 