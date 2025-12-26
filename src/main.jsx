import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Suppress Vite HMR iframe-related errors (common with canvas libraries like React Konva)
window.addEventListener('error', (event) => {
  if (event.message?.includes('Iframe') || event.message?.includes('iframe')) {
    event.preventDefault();
    console.warn('[HMR] Iframe error suppressed - this is harmless');
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Iframe') || event.reason?.message?.includes('iframe')) {
    event.preventDefault();
    console.warn('[HMR] Iframe promise rejection suppressed - this is harmless');
    return true;
  }
});

function Root() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App isAdmin={isAdmin} setIsAdmin={setIsAdmin} />} />
        <Route path="/admin" element={<AdminPage onAdminLogin={() => setIsAdmin(true)} />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
