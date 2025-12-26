import React from 'react';
import { nodes } from '../../data/buildingData';
import {
    MapPin,
    Navigation,
    Clock,
    Route,
    ArrowUpFromLine,
    MoveVertical,
    Droplet,
    DoorOpen,
    ArrowRight
} from 'lucide-react';
import './RouteInfo.css';

const RouteInfo = ({ path, distance, startLabel, endLabel }) => {
    if (!path || path.length === 0) {
        return null;
    }

    // Calculate estimated walking time (assuming 1.4 m/s walking speed)
    const estimatedTimeSeconds = Math.ceil(distance / 1.4);
    const minutes = Math.floor(estimatedTimeSeconds / 60);
    const seconds = estimatedTimeSeconds % 60;

    // Get turn-by-turn directions
    const getDirections = () => {
        const directions = [];

        for (let i = 0; i < path.length; i++) {
            const nodeId = path[i];
            const node = nodes[nodeId];

            if (!node) continue;

            if (i === 0) {
                directions.push({
                    step: 1,
                    instruction: startLabel || node.label,
                    icon: MapPin,
                    type: 'start',
                });
            } else if (i === path.length - 1) {
                directions.push({
                    step: directions.length + 1,
                    instruction: endLabel || node.label,
                    icon: Navigation,
                    type: 'end',
                });
            } else if (node.type !== 'corridor') {
                // Only show non-corridor waypoints
                directions.push({
                    step: directions.length + 1,
                    instruction: node.label,
                    icon: getNodeIcon(node.type),
                    type: 'waypoint',
                });
            }
        }

        return directions;
    };

    const getNodeIcon = (type) => {
        switch (type) {
            case 'lift':
                return MoveVertical;
            case 'stairs':
                return ArrowUpFromLine;
            case 'washroom_gents':
            case 'washroom_ladies':
                return Droplet;
            case 'entrance':
                return DoorOpen;
            default:
                return ArrowRight;
        }
    };

    const directions = getDirections();

    return (
        <div className="route-info-container">
            <div className="route-summary">
                <div className="route-header">
                    <h3 className="route-title">Route Found</h3>
                    <div className="route-badges">
                        <span className="route-badge">
                            <Route size={14} />
                            {Math.round(distance * 0.2)} steps
                        </span>
                        <span className="route-badge">
                            <Clock size={14} />
                            {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
                        </span>
                    </div>
                </div>

                <div className="route-endpoints">
                    <div className="endpoint start-point">
                        <MapPin size={16} className="endpoint-icon" />
                        <div className="endpoint-text">
                            <span className="endpoint-label">FROM</span>
                            <span className="endpoint-name">{startLabel}</span>
                        </div>
                    </div>
                    <ArrowRight size={16} className="route-arrow" />
                    <div className="endpoint end-point">
                        <Navigation size={16} className="endpoint-icon" />
                        <div className="endpoint-text">
                            <span className="endpoint-name">{endLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="directions-list">
                <h4 className="directions-title">TURN-BY-TURN DIRECTIONS</h4>
                {directions.map((direction, index) => {
                    const IconComponent = direction.icon;
                    return (
                        <div
                            key={index}
                            className={`direction-item ${direction.type}`}
                        >
                            <span className="step-number">{direction.step}</span>
                            <IconComponent size={18} className="direction-icon" />
                            <span className="direction-text">
                                {direction.type === 'start' && 'Start at '}
                                {direction.type === 'end' && 'Arrive at '}
                                {direction.instruction}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RouteInfo;
