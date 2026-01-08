import React, { useState } from 'react';
import { Settings, X, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './SettingsPanel.css';

const SettingsPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setLightMode, setDarkMode } = useTheme();

    const themeOptions = [
        {
            id: 'light',
            name: 'Light Mode',

            icon: Sun,
            action: setLightMode
        },
        {
            id: 'dark',
            name: 'Dark Mode',
            icon: Moon,
            action: setDarkMode
        }
    ];

    return (
        <>
            {/* Settings Trigger Button */}
            <button
                className="settings-trigger glass-btn"
                onClick={() => setIsOpen(true)}
                title="Settings"
                aria-label="Open settings"
            >
                <Settings size={20} />
            </button>

            {/* Settings Panel Overlay */}
            {isOpen && (
                <>
                    <div className="settings-overlay" onClick={() => setIsOpen(false)} />
                    <div className="settings-panel">
                        {/* Header */}
                        <div className="settings-header">
                            <div className="settings-title">
                                <Settings size={20} />
                                <h2>Settings</h2>
                            </div>
                            <button
                                className="settings-close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close settings"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="settings-content">
                            {/* Theme Section */}
                            <div className="settings-section">
                                <h3 className="section-title">Appearance</h3>
                                <p className="section-description">
                                    Choose your preferred theme. Changes apply instantly across the entire app.
                                </p>

                                <div className="theme-options">
                                    {themeOptions.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = theme === option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                className={`theme-option ${isSelected ? 'selected' : ''}`}
                                                onClick={option.action}
                                            >
                                                <Icon size={24} />
                                                <div className="theme-option-content">
                                                    <div className="theme-option-name">{option.name}</div>
                                                    {option.description && (
                                                        <div className="theme-option-description">{option.description}</div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="theme-option-check">
                                                        <Check size={20} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default SettingsPanel;
