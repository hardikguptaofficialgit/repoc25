import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowUpCircle, MoveVertical, User, Users, LogOut, Droplets } from 'lucide-react';
import './QuickActions.css';

const QuickActions = ({ onQuickAction, currentLocation, minimized = false }) => {
    const [isExpanded, setIsExpanded] = useState(!minimized);

    useEffect(() => {
        setIsExpanded(!minimized);
    }, [minimized]);

    const quickActions = [
        {
            id: 'nearest_stairs',
            label: 'Nearest Stairs',
            color: '#10B981',
            action: 'stairs',
            icon: <ArrowUpCircle size={20} />
        },
        {
            id: 'nearest_lift',
            label: 'Nearest Lift',
            color: '#8B5CF6',
            action: 'lift',
            icon: <MoveVertical size={20} />
        },
        {
            id: 'nearest_gents',
            label: 'Gents Washroom',
            color: '#0EA5E9',
            action: 'washroom_gents',
            icon: <User size={20} />
        },
        {
            id: 'nearest_ladies',
            label: 'Ladies Washroom',
            color: '#EC4899',
            action: 'washroom_ladies',
            icon: <Users size={20} />
        },
        {
            id: 'nearest_entrance',
            label: 'Nearest Exit',
            color: '#F59E0B',
            action: 'entrance',
            icon: <LogOut size={20} />
        },
        {
            id: 'nearest_water',
            label: 'Water Cooler',
            color: '#06B6D4',
            action: 'water_cooler',
            icon: <Droplets size={20} />
        },
    ];

    const handleClick = (action) => {
        if (!currentLocation) {
            // Ideally use a toast, but this works for now
            return;
        }
        onQuickAction(action);
    };

    return (
        <div className={`quick-actions-container ${!isExpanded ? 'collapsed' : ''}`}>
            <div className="campus-overview-section">
                <h3 className="section-title">Campus Overview</h3>
                <div className="overview-stats">
                    <div className="overview-stat">
                        <span className="stat-value">5</span>
                        <span className="stat-label">Floors</span>
                    </div>
                    <div className="overview-stat">
                        <span className="stat-value">42</span>
                        <span className="stat-label">Rooms</span>
                    </div>
                    <div className="overview-stat">
                        <span className="stat-value">12</span>
                        <span className="stat-label">POIs</span>
                    </div>
                </div>
            </div>

            <div
                className="quick-actions-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="quick-actions-title">Quick Navigate</h3>
                <div className="toggle-icon">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </div>

            {isExpanded && (
                <div className="quick-actions-grid animate-in">
                    {quickActions.map((action) => (
                        <button
                            key={action.id}
                            className="quick-action-button"
                            onClick={() => handleClick(action.action)}
                            style={{ '--action-color': action.color }}
                            disabled={!currentLocation}
                            title={!currentLocation ? "Select a start location first" : action.label}
                        >
                            <span className="action-icon">{action.icon}</span>
                            <span className="action-label">{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuickActions;
