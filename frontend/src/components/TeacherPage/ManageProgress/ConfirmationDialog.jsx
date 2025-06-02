import React from 'react';
import { FaExclamationTriangle, FaMobile, FaTimes } from 'react-icons/fa';
import './css/PrescriptiveAnalysis.css';

/**
 * Confirmation Dialog Component
 * Used to confirm potentially irreversible actions like pushing an intervention to mobile
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the dialog
 * @param {Function} props.onConfirm - Function to call when action is confirmed
 * @param {Function} props.onCancel - Function to call when action is cancelled
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.confirmText - Text for the confirm button
 * @param {string} props.cancelText - Text for the cancel button
 * @param {React.ReactNode} props.icon - Icon to display in the dialog header
 */
const ConfirmationDialog = ({
  show,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon = <FaExclamationTriangle />
}) => {
  if (!show) return null;

  return (
    <div className="literexia-confirmation-dialog">
      <div className="literexia-dialog-content">
        <div className="literexia-dialog-header">
          <div className="literexia-dialog-icon">
            {icon}
          </div>
          <h3>{title}</h3>
        </div>
        
        <div className="literexia-dialog-message">
          {message}
        </div>
        
        <div className="literexia-dialog-actions">
          <button 
            className="literexia-dialog-btn literexia-dialog-btn-cancel"
            onClick={onCancel}
          >
            <FaTimes /> {cancelText}
          </button>
          <button 
            className="literexia-dialog-btn literexia-dialog-btn-confirm"
            onClick={onConfirm}
          >
            <FaMobile /> {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 