// src/components/Charts/ChartCard.jsx
import React from 'react';

/**
 * Reusable card component for charts with consistent styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Chart title
 * @param {React.ReactNode} props.children - Chart component
 * @param {string} props.chartType - Type of chart (bar, line, pie)
 * @param {Object} props.style - Additional style properties
 * @param {React.ReactNode} props.actionElement - Optional action element (e.g., dropdown)
 */
const ChartCard = ({ 
  title, 
  children, 
  chartType = '', 
  style = {}, 
  actionElement 
}) => {
  return (
    <div className="chart-card" style={style}>
      <h2 className={`chart-title ${chartType}-chart`}>
        {title}
        {actionElement && (
          <div className="chart-actions">
            {actionElement}
          </div>
        )}
      </h2>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;