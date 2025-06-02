import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import './css/PrescriptiveAnalysis.css';

/**
 * Success Notification Component
 * Displays a temporary success notification message that auto-dismisses
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the notification
 * @param {Function} props.onDismiss - Function to call when notification is dismissed
 * @param {string} props.title - Notification title
 * @param {string} props.message - Notification message
 * @param {number} props.duration - How long to display the notification (in ms)
 */
const SuccessNotification = ({
  show,
  onDismiss,
  title = "Success!",
  message = "Operation completed successfully.",
  duration = 5000
}) => {
  const [visible, setVisible] = useState(show);
  
  useEffect(() => {
    setVisible(show);
    
    let timer;
    if (show) {
      timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, onDismiss, duration]);
  
  if (!visible) return null;
  
  return (
    <div className="literexia-success-notification">
      <div className="literexia-notification-icon">
        <FaCheckCircle />
      </div>
      <div className="literexia-notification-content">
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default SuccessNotification; 