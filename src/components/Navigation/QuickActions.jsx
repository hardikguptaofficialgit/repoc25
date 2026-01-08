import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './QuickActions.css';

const QuickActions = ({ onQuickAction, currentLocation, minimized = false, crossFloorPhase = 0, isOnNewFloor = false }) => {
    const [isExpanded, setIsExpanded] = useState(!minimized);

    useEffect(() => {
        setIsExpanded(!minimized);
    }, [minimized]);

    // Enable quick actions if user has a start location OR is on a new floor after cross-floor navigation
    const canUseQuickActions = currentLocation || (crossFloorPhase === 3 && isOnNewFloor);

    const quickActions = [
        {
            id: 'nearest_stairs',
            label: 'Nearest Stairs',
            color: '#10B981',
            action: 'stairs',
        },
        {
            id: 'nearest_lift',
            label: 'Nearest Lift',
            color: '#3B82F6',
            action: 'lift',
        },
        {
            id: 'nearest_gents',
            label: 'Gents Washroom',
            color: '#8B5CF6',
            action: 'washroom_gents',
        },
        {
            id: 'nearest_ladies',
            label: 'Ladies Washroom',
            color: '#EC4899',
            action: 'washroom_ladies',
        },
        {
            id: 'nearest_entrance',
            label: 'Nearest Exit',
            color: '#F59E0B',
            action: 'entrance',
        },
        {
            id: 'nearest_water',
            label: 'Water Cooler',
            color: '#00CED1',
            action: 'water_cooler',
        },
    ];

    const handleClick = (action) => {
        if (!canUseQuickActions) {
            alert('Please select a starting location first');
            return;
        }
        onQuickAction(action);
    };

    return (
        <div className={`quick-actions-container ${!isExpanded ? 'collapsed' : ''}`}>
            <div
                className="quick-actions-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="quick-actions-title">
                    {isOnNewFloor && crossFloorPhase === 3 ? 'Find Nearby' : 'Quick Navigation'}
                </h3>
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
                            disabled={!canUseQuickActions}
                        >
                            <span className="action-label">{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuickActions;
