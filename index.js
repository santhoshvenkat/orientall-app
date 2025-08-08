import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

const e = React.createElement;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element with ID 'root'");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  e(React.StrictMode, null, e(App))
);
