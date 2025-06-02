// src/components/TeacherPage/FileUpload.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTimes } from '@fortawesome/free-solid-svg-icons';

const FileUpload = ({ onFileSelect, label, fileType = 'image/*', currentFile = null }) => {
  const [fileName, setFileName] = useState(currentFile ? currentFile.split('/').pop() : '');
  const [preview, setPreview] = useState(currentFile);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setFileName(file.name);
    onFileSelect(file);
  };

  const clearFile = () => {
    setFileName('');
    setPreview(null);
    onFileSelect(null);
  };

  return (
    <div className="pa-file-upload">
      <div className="pa-file-upload-controls">
        <label className="pa-file-upload-btn">
          <FontAwesomeIcon icon={faUpload} /> Choose File
          <input 
            type="file"
            accept={fileType}
            onChange={handleFileChange}
            className="pa-file-input"
          />
        </label>
        
        {fileName && (
          <button 
            type="button" 
            className="pa-file-clear-btn"
            onClick={clearFile}
            title="Remove file"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>
      
      <div className="pa-file-info">
        {fileName ? (
          <span className="pa-file-name">{fileName}</span>
        ) : (
          <span className="pa-file-placeholder">No file chosen</span>
        )}
      </div>
      
      {preview && fileType.includes('image') && (
        <div className="pa-image-preview">
          <img 
            src={preview} 
            alt="Preview" 
            className="pa-preview-image"
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;