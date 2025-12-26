import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowLeft } from 'lucide-react';
import './AdminPage.css';

const AdminPage = ({ onAdminLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const correctUser = import.meta.env.VITE_ADMIN_USERNAME;
        const correctPass = import.meta.env.VITE_ADMIN_PASSWORD;

        if (username === correctUser && password === correctPass) {
            localStorage.setItem('adminSession', 'true');
            onAdminLogin();
            navigate('/');
        } else {
            setError('Invalid credentials');
            setTimeout(() => setError(''), 3000);
        }
    };

    return (
        <div className="admin-page">
            <button className="back-to-home glass-btn" onClick={() => navigate('/')}>
                <ArrowLeft size={18} />
                <span>Back to Map</span>
            </button>

            <div className="admin-login-container">
                <div className="admin-login-card glass-panel animate-in">
                    <div className="login-header">
                        <div className="lock-icon">
                            <Lock size={40} />
                        </div>
                        <h1>Admin Panel</h1>
                        <p>Authenticate to access map editor</p>
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
                                autoFocus
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
                            Access Editor
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
};

export default AdminPage;
