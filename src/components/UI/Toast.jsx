import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={18} />;
            case 'error': return <AlertCircle size={18} />;
            case 'info': return <Info size={18} />;
            default: return <CheckCircle size={18} />;
        }
    };

    return (
        <div className={`toast-notification ${type} animate-toast-in`}>
            <div className="toast-icon-wrapper">
                {getIcon()}
            </div>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>
                <X size={14} />
            </button>
        </div>
    );
};

export default Toast;
