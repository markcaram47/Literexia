// src/index.js or src/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AppProviders from './AppProviders';

// Create a root
const container = document.getElementById('root');
const root = createRoot(container);

// Render app to root
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);