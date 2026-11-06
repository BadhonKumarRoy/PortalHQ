// src/main.jsx
// This is the entry point of the entire React application.
// It mounts the App component into the HTML page and sets up global notifications.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* The main application */}
    <App />
    {/* Global toast notification system — shows pop-up messages anywhere in the app */}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#1E293B',
          color: '#fff',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#36ADA3', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  </React.StrictMode>
);
