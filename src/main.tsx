import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/app.css';

const MummysPartyMediaPreview = React.lazy(() => import('./app/MummysPartyMediaPreview').then((module) => ({ default: module.MummysPartyMediaPreview })));

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <React.StrictMode>
    {new URLSearchParams(window.location.search).get('media') === 'mummys-party'
      ? <React.Suspense fallback={<p>Loading media preview…</p>}><MummysPartyMediaPreview /></React.Suspense>
      : <App />}
  </React.StrictMode>,
);
