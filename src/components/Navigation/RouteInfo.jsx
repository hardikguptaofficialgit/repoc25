import React, { useState } from 'react';
import {
    MapPin,
    Navigation,
    Clock,
    Route,
    ArrowUpCircle,
    MoveVertical,
    Footprints,
    Flag,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import './RouteInfo.css';

const RouteInfo = ({ path, instructions, distance, startLabel, endLabel, isNavigating, onStartNavigation }) => {
    const [expanded, setExpanded] = useState(true);

    if (!path || path.length === 0) {
        return null;
    }

    // Calculate estimated walking time (assuming 1.4 m/s walking speed)
    const estimatedTimeSeconds = Math.ceil(distance / 1.4);
    const minutes = Math.floor(estimatedTimeSeconds / 60);
    const seconds = estimatedTimeSeconds % 60;

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'map-pin': return MapPin;
            case 'arrow-up-circle': return ArrowUpCircle;
            case 'move-vertical': return MoveVertical;
            case 'footprints': return Footprints;
            case 'flag': return Flag;
            default: return Navigation;
        }
    };

    return (
        <div className="route-info-container">
            <div className="route-summary">
                <div className="route-header" onClick={() => setExpanded(!expanded)}>
                    <div className="header-left">
                        <h3 className="route-title">Route Details</h3>
                        <div className="route-badges">
                            <span className="route-badge distance-badge">
                                <Route size={14} />
                                {Math.round(distance)}m
                            </span>
                            <span className="route-badge time-badge">
                                <Clock size={14} />
                                {minutes}m {seconds}s
                            </span>
                        </div>
                    </div>
                    <button className="expand-btn">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {expanded && instructions && instructions.length > 0 && (
                <div className="directions-list animate-slide-down">
                    <h4 className="directions-title">Step-by-Step</h4>
                    {instructions.map((step, index) => {
                        const IconComponent = getIcon(step.icon);
                        return (
                            <div key={index} className="direction-item">
                                <div className="step-indicator">
                                    <div className="step-number">{index + 1}</div>
                                    {index < instructions.length - 1 && <div className="step-line"></div>}
                                </div>
                                <div className="direction-content">
                                    <div className={`direction-icon-wrapper type-${step.type}`}>
                                        <IconComponent size={18} />
                                    </div>
                                    <span className="direction-text">{step.text}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!isNavigating && (
                <div className="navigation-actions">
                    <button className="start-nav-btn" onClick={onStartNavigation}>
                        <Navigation size={18} />
                        Start Navigation
                    </button>
                </div>
            )}
        </div>
    );
};

export default RouteInfo;
