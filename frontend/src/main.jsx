import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#0b0b1a',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#f1f5f9',
          fontFamily: 'DM Sans, sans-serif',
        },
      }}
    />
  </React.StrictMode>,
)
