import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import './InstallPrompt.css';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Check if already installed or dismissed
        const isInstalled = localStorage.getItem('pwa-installed');
        const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
        
        if (isInstalled || isDismissed) {
            return;
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Show prompt after 2 seconds
            setTimeout(() => {
                setShowPrompt(true);
                
                // Auto-hide after 5 seconds if not interacted with
                setTimeout(() => {
                    if (showPrompt) {
                        setShowPrompt(false);
                    }
                }, 5000);
            }, 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            localStorage.setItem('pwa-installed', 'true');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
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
                    <button className="dismiss-btn" onClick={handleDismiss}>
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
