import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronUp,
    ArrowUp,
    MoveVertical,
    User,
    Users,
    LogOut,
    Droplet
} from 'lucide-react';
import './QuickActions.css';

const QuickActions = ({ onQuickAction, currentLocation, minimized = false }) => {
    const [isExpanded, setIsExpanded] = useState(!minimized);

    useEffect(() => {
        setIsExpanded(!minimized);
    }, [minimized]);

    const quickActions = [
        {
            id: 'nearest_stairs',
            label: 'Stairs',
            color: 'var(--accent-green)',
            action: 'stairs',
            icon: <ArrowUp size={28} />
        },
        {
            id: 'nearest_lift',
            label: 'Lift',
            color: 'var(--accent-blue)',
            action: 'lift',
            icon: <MoveVertical size={28} />
        },
        {
            id: 'nearest_gents',
            label: 'Gents',
            color: 'var(--accent-purple)',
            action: 'washroom_gents',
            icon: <User size={28} />
        },
        {
            id: 'nearest_ladies',
            label: 'Ladies',
            color: 'var(--accent-pink)',
            action: 'washroom_ladies',
            icon: <Users size={28} />
        },
        {
            id: 'nearest_entrance',
            label: 'Exit',
            color: 'var(--accent-yellow)',
            action: 'entrance',
            icon: <LogOut size={28} />
        },
        {
            id: 'nearest_water',
            label: 'Water',
            color: 'var(--accent-cyan)',
            action: 'water_cooler',
            icon: <Droplet size={28} />
        },
    ];

    const handleClick = (action) => {
        if (!currentLocation) {
            alert('Please select a starting location first');
            return;
        }
        onQuickAction(action);
    };

    return (
        <div className={`quick-actions-container ${!isExpanded ? 'collapsed' : ''}`}>
            <div className="quick-actions-header">
                <h3 className="quick-actions-title">QUICK NAVIGATION</h3>
            </div>

            {isExpanded && (
                <div className="quick-actions-grid animate-in">
                    {quickActions.map((action) => (
                        <button
                            key={action.id}
                            className="quick-action-square"
                            onClick={() => handleClick(action.action)}
                            disabled={!currentLocation}
                        >
                            <div className="action-icon" style={{ color: action.color }}>
                                {action.icon}
                            </div>
                            <span className="action-label">{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuickActions;

