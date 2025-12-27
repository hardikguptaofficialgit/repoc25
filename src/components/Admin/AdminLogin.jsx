import React, { useState } from 'react';
import { Lock, User, X } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = ({ onLogin, onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const correctUser = import.meta.env.VITE_ADMIN_USERNAME;
        const correctPass = import.meta.env.VITE_ADMIN_PASSWORD;

        if (username === correctUser && password === correctPass) {
            onLogin();
            onClose();
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="admin-login-overlay">
            <div className="admin-login-card glass-panel animate-in">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
                <div className="login-header">
                    <div className="lock-icon">
                        <Lock size={32} />
                    </div>
                    <h2>Admin Services</h2>
                    <p>Enter your KIIT credentials to proceed</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-field">
                        <User size={18} className="field-icon" />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <Lock size={18} className="field-icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-submit">
                        Login to Editor
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
