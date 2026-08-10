// v2 - sort_order fix
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './CitadelCMS.jsx'

window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
    <h2>Admin Dashboard Crashed</h2>
    <p><strong>Error:</strong> ${message}</p>
    <p><strong>Location:</strong> ${source}:${lineno}:${colno}</p>
    <pre>${error ? error.stack : ''}</pre>
  </div>`;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
