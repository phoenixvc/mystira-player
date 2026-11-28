import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/app.css';

const MummysPartyMediaPreview = React.lazy(() => import('./app/MummysPartyMediaPreview').then((module) => ({ default: module.MummysPartyMediaPreview })));

class PreviewErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <main><p>The media preview could not load.</p><button type="button" onClick={() => window.location.reload()}>Reload</button> <a href={import.meta.env.BASE_URL}>Back to player</a></main>
      : this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <React.StrictMode>
    {new URLSearchParams(window.location.search).get('media') === 'mummys-party'
      ? <PreviewErrorBoundary><React.Suspense fallback={<p>Loading media preview…</p>}><MummysPartyMediaPreview /></React.Suspense></PreviewErrorBoundary>
      : <App />}
  </React.StrictMode>,
);
