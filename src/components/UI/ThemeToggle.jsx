import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ variant = 'default' }) => {
    const { theme, setLightMode, setDarkMode, isLight } = useTheme();

    if (variant === 'buttons') {
        return (
            <div className="theme-toggle-buttons">
                <button
                    className={`theme-btn ${isLight ? 'active' : ''}`}
                    onClick={setLightMode}
                    title="Light Mode"
                >
                    <Sun size={16} />
                    <span>Light</span>
                </button>
                <button
                    className={`theme-btn ${!isLight ? 'active' : ''}`}
                    onClick={setDarkMode}
                    title="Dark Mode"
                >
                    <Moon size={16} />
                    <span>Dark</span>
                </button>
            </div>
        );
    }

    // Default toggle switch variant
    return (
        <div className="theme-toggle-container">
            <label className="theme-toggle-label">
                <Sun size={14} className="theme-icon sun-icon" />
                <div className="theme-toggle-switch">
                    <input
                        type="checkbox"
                        checked={!isLight}
                        onChange={() => isLight ? setDarkMode() : setLightMode()}
                        aria-label="Toggle theme"
                    />
                    <span className="theme-slider"></span>
                </div>
                <Moon size={14} className="theme-icon moon-icon" />
            </label>
        </div>
    );
};

export default ThemeToggle;
