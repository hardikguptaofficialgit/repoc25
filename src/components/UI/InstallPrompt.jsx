import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import './InstallPrompt.css';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Check if already installed
        const isInstalled = localStorage.getItem('pwa-installed');
        
        // Check if dismissed in this session (sessionStorage clears on tab close)
        const isDismissedThisSession = sessionStorage.getItem('pwa-prompt-dismissed-session');
        
        // Check if permanently dismissed (localStorage persists)
        const isPermanentlyDismissed = localStorage.getItem('pwa-prompt-dismissed');
        
        if (isInstalled || isDismissedThisSession || isPermanentlyDismissed) {
            return;
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstall = (e) => {
            console.log('[PWA] beforeinstallprompt event fired');
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Show prompt after 3 seconds
            setTimeout(() => {
                setShowPrompt(true);
                console.log('[PWA] Showing install prompt');
            }, 3000);
        };

        // Check if already installed (running in standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            console.log('[PWA] App is already installed');
            localStorage.setItem('pwa-installed', 'true');
            return;
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Fallback: If event doesn't fire after 5 seconds, still show prompt on first load
        const fallbackTimer = setTimeout(() => {
            if (!deferredPrompt && !showPrompt && !isInstalled) {
                console.log('[PWA] Showing fallback prompt');
                setShowPrompt(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            clearTimeout(fallbackTimer);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            console.log('[PWA] No deferred prompt available');
            // If no prompt available, just dismiss
            handleDismiss();
            return;
        }

        console.log('[PWA] Prompting user to install');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('[PWA] User choice:', outcome);
        if (outcome === 'accepted') {
            localStorage.setItem('pwa-installed', 'true');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        console.log('[PWA] User dismissed install prompt');
        // Dismiss for this session only
        sessionStorage.setItem('pwa-prompt-dismissed-session', 'true');
        setShowPrompt(false);
    };

    const handlePermanentDismiss = () => {
        console.log('[PWA] User permanently dismissed install prompt');
        // Permanently dismiss
        localStorage.setItem('pwa-prompt-dismissed', 'true');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className={`install-prompt ${showPrompt ? 'show' : ''}`}>
            <div className="install-prompt-content">
                <div className="install-icon">
                    <Download size={24} />
                </div>
                <div className="install-text">
                    <h3>Install Campus Nav</h3>
                    <p>Get quick access from your home screen</p>
                </div>
                <div className="install-actions">
                    <button className="install-btn" onClick={handleInstall}>
                        Install
                    </button>
                    <button className="dismiss-btn" onClick={handleDismiss} title="Dismiss for this session">
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
