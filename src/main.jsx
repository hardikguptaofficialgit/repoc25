import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Compute safe-area insets for browsers where env(safe-area-inset-*) is 0 (common on Android).
// Uses visualViewport to estimate the occluded bottom area (system bars / dynamic UI).
const installSafeAreaVars = () => {
  const root = document.documentElement;

  // Keep the last "non-keyboard" bottom inset so the bottom sheet stays under
  // the keyboard (keyboard should overlay UI), but still respects system bars.
  let lastNonKeyboardBottom = 0;

  const KEYBOARD_OPEN_THRESHOLD_PX = 140;

  const update = () => {
    const vv = window.visualViewport;
    if (!vv) return;

    const top = Math.max(0, vv.offsetTop || 0);
    const bottomCandidate = Math.max(0, window.innerHeight - (vv.height + (vv.offsetTop || 0)));

    // When the keyboard opens, visualViewport height shrinks a lot; we do NOT
    // want to treat that as "safe area" (otherwise bottom UI jumps above keyboard).
    const keyboardLikelyOpen = (window.innerHeight - vv.height) > KEYBOARD_OPEN_THRESHOLD_PX;
    if (!keyboardLikelyOpen) {
      lastNonKeyboardBottom = bottomCandidate;
    }

    const bottom = lastNonKeyboardBottom;

    // Left/right are usually 0 on mobile browsers; keep for completeness.
    const left = 0;
    const right = 0;

    root.style.setProperty('--vv-safe-top', `${top}px`);
    root.style.setProperty('--vv-safe-bottom', `${bottom}px`);
    root.style.setProperty('--vv-safe-left', `${left}px`);
    root.style.setProperty('--vv-safe-right', `${right}px`);
  };

  // Throttle via rAF to avoid spamming layout on scroll/resize.
  let rafId = 0;
  const schedule = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      update();
    });
  };

  update();
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
  };
};

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

  useEffect(() => {
    const cleanup = installSafeAreaVars();
    return cleanup;
  }, []);

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
