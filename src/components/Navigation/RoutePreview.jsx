import React from 'react';
import {
    ChevronLeft,
    Route,
    Clock,
    MapPin,
    Navigation,
    ArrowRight,
    RefreshCcw,
    ChevronDown
} from 'lucide-react';
import { nodes } from '../../data/buildingData';
import './RoutePreview.css';

const RoutePreview = ({ path, distance, startLabel, endLabel, onBack, onStartNavigation }) => {
    if (!path || path.length === 0) return null;

    // Calculate estimated walking time (assuming 1.4 m/s walking speed)
    const estimatedTimeSeconds = Math.ceil(distance / 1.4);
    const minutes = Math.floor(estimatedTimeSeconds / 60);
    const seconds = estimatedTimeSeconds % 60;
    const stepCount = Math.round(distance * 1.5); // Arbitrary step multiplier

    const getDirections = () => {
        const directions = [];
        if (!path || path.length === 0) return directions;

        // 1. Initial Step
        const startNode = nodes[path[0]];
        directions.push({
            step: 1,
            instruction: `Start at ${startLabel || startNode?.label || 'your location'}`,
            icon: <MapPin size={20} color="#FF5C35" />,
            color: '#00F5A0',
            type: 'start'
        });

        // 2. Intermediate Steps
        let corridorCount = 0;
        for (let i = 1; i < path.length - 1; i++) {
            const nodeId = path[i];
            const node = nodes[nodeId];
            if (!node) continue;

            let instruction = '';
            let icon = <Navigation size={20} color="#FF5C35" />;
            let color = 'rgba(255, 255, 255, 0.4)';

            // Identify significant nodes
            if (node.type === 'lift') {
                instruction = `Take ${node.label || 'Lift'} to your floor`;
                icon = <ArrowUpCircle size={20} color="#ff5c00" />;
                color = '#ff5c00';
            } else if (node.type === 'stairs') {
                instruction = `Use ${node.label || 'Stairs'} to proceed`;
                icon = <Layers size={20} color="#3b82f6" />;
                color = '#3b82f6';
            } else if (node.label && node.label.length > 0 && !node.label.includes('node_') && !node.label.includes('New Node')) {
                instruction = `Pass by ${node.label}`;
            } else if (node.type === 'entrance') {
                instruction = `Exit/Enter via ${node.label}`;
            }

            if (instruction) {
                // If we've been in a corridor for a while, we could add a "Continue" here
                // but usually "Pass by" is enough context.
                directions.push({
                    step: directions.length + 1,
                    instruction,
                    icon,
                    color,
                    type: 'waypoint'
                });
                corridorCount = 0; // reset
            } else {
                corridorCount++;
                // If we've gone 5 corridor nodes without an instruction, add a generic one
                if (corridorCount === 5) {
                    directions.push({
                        step: directions.length + 1,
                        instruction: 'Continue along the corridor',
                        icon: <Navigation size={20} color="#555" />,
                        color: 'rgba(255, 255, 255, 0.1)',
                        type: 'corridor'
                    });
                    corridorCount = 0;
                }
            }
        }

        // 3. Final Step
        const endNode = nodes[path[path.length - 1]];
        directions.push({
            step: directions.length + 1,
            instruction: `Arrive at ${endLabel || endNode?.label || 'destination'}`,
            icon: <Navigation size={20} color="#FF5C35" />,
            color: '#FF3D3D',
            type: 'end'
        });

        return directions;
    };

    const directions = getDirections();

    return (
        <div className="route-preview-container animate-fade-in">
            <div className="preview-header">
                <button className="back-circle-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <div className="preview-titles">
                    <h2>Route Preview</h2>
                    <span className="preview-subtitle">Fastest path to {endLabel}</span>
                </div>
            </div>

            <div className="preview-scroll-area">
                <div className="section-label-group">
                    <span className="section-small-label">ROUTE FOUND</span>
                </div>

                <div className="preview-summary-badges">
                    <div className="summary-badge steps">
                        <Route size={16} color="var(--accent-orange)" />
                        <span>{stepCount} steps</span>
                    </div>
                    <div className="summary-badge duration">
                        <Clock size={16} color="var(--accent-orange)" />
                        <span>{minutes}m {seconds}s</span>
                    </div>
                </div>

                <div className="preview-endpoints">
                    <div className="endpoints-track">
                        <div className="track-point start">
                            <MapPin size={18} />
                        </div>
                        <div className="track-line"></div>
                        <div className="track-point end">
                            <Navigation size={18} color="var(--accent-orange)" />
                        </div>
                    </div>
                    <div className="endpoints-text">
                        <div className="endpoint-group">
                            <span className="endpoint-meta">FROM</span>
                            <span className="endpoint-name">{startLabel}</span>
                        </div>
                        <div className="endpoint-separator">
                            <ArrowRight size={14} color="#888" />
                        </div>
                        <div className="endpoint-group">
                            <span className="endpoint-meta">TO</span>
                            <span className="endpoint-name destination">{endLabel}</span>
                        </div>
                    </div>
                </div>

                <div className="section-label-group directions-header">
                    <span className="section-small-label">TURN-BY-TURN DIRECTIONS</span>
                </div>

                <div className="preview-directions-list">
                    {directions.map((dir, idx) => (
                        <div key={idx} className="direction-card" style={{ '--accent-color': dir.color }}>
                            <div className="dir-step-index">{dir.step}</div>
                            <div className="dir-icon-box">
                                {dir.icon}
                            </div>
                            <div className="dir-text">{dir.instruction}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="preview-actions">
                <button className="start-nav-btn" onClick={onStartNavigation}>
                    Start Navigation
                    <Navigation size={20} className="nav-arrow-icon" fill="currentColor" />
                </button>
            </div>
        </div>
    );
};

export default RoutePreview;
