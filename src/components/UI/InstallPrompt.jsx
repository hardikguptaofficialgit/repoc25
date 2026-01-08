import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './InstallPrompt.css';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const deferredPromptRef = useRef(null);
    const fallbackTimerRef = useRef(null);

    useEffect(() => {
        const isInstalled =
            localStorage.getItem('pwa-installed') === 'true' ||
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        const dismissedSession =
            sessionStorage.getItem('pwa-prompt-dismissed-session') === 'true';

        const dismissedPermanent =
            localStorage.getItem('pwa-prompt-dismissed') === 'true';

        if (isInstalled || dismissedSession || dismissedPermanent) return;

        const handleBeforeInstall = (e) => {
            e.preventDefault();
            deferredPromptRef.current = e;

            // delay prompt for better UX
            fallbackTimerRef.current = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // fallback if event never fires
        fallbackTimerRef.current = setTimeout(() => {
            if (!deferredPromptRef.current) {
                setShowPrompt(true);
            }
        }, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            clearTimeout(fallbackTimerRef.current);
        };
    }, []);

    const handleInstall = async () => {
        const promptEvent = deferredPromptRef.current;

        if (!promptEvent) {
            handleDismiss();
            return;
        }

        try {
            await promptEvent.prompt();
            const { outcome } = await promptEvent.userChoice;

            if (outcome === 'accepted') {
                localStorage.setItem('pwa-installed', 'true');
            }

            deferredPromptRef.current = null;
            setShowPrompt(false);
        } catch {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        sessionStorage.setItem('pwa-prompt-dismissed-session', 'true');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="install-prompt show">
            <div className="install-prompt-content">
                <div className="install-text">
                    <h3>C25GO</h3>
                    <p>Install the app for a faster, app-like experience.</p>
                </div>

                <div className="install-actions">
                    <button className="install-btn" onClick={handleInstall}>
                        Install
                    </button>

                    <button
                        className="dismiss-btn"
                        onClick={handleDismiss}
                        aria-label="Dismiss install prompt"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
