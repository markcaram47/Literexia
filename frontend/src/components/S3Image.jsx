// src/components/S3Image.jsx
import React, { useState } from 'react';

const S3Image = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText = null,
  style = {}
}) => {
  const [imgError, setImgError] = useState(false);
  
  // Generate initials from name
  const getInitials = () => {
    if (fallbackText) return fallbackText;
    if (!alt) return '?';
    
    return alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // If image failed to load or no src provided, display initials
  if (imgError || !src) {
    return (
      <div 
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#4b5563',
          color: 'white',
          borderRadius: '50%',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          ...style
        }}
      >
        {getInitials()}
      </div>
    );
  }
  
  // Try to load the image
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      style={{
        objectFit: 'cover',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        ...style
      }}
      onError={() => {
        console.error(`Image failed to load: ${src}`);
        setImgError(true);
      }}
    />
  );
};

export default S3Image;