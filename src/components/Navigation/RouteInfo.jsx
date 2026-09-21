import React, { useMemo } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import './RouteInfo.css';

const WALKING_SPEED = 1.4; // m/s

const RouteInfo = ({ path = [], distance = 0, startLabel = '', endLabel = '' }) => {
  const safePath = Array.isArray(path) ? path : [];

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

  // Memoized directions for performance + correctness
  const directions = useMemo(() => {
    const result = [];
    let stepCounter = 1;

    safePath.forEach((nodeId, index) => {
      const node = nodes[nodeId];
      if (!node) return;

      if (index === 0) {
        result.push({
          step: stepCounter++,
          instruction: startLabel || node.label,
          icon: MapPin,
          type: 'start',
        });
        return;
      }

      if (index === safePath.length - 1) {
        result.push({
          step: stepCounter++,
          instruction: endLabel || node.label,
          icon: Navigation,
          type: 'end',
        });
        return;
      }

      if (node.type !== 'corridor') {
        result.push({
          step: stepCounter++,
          instruction: node.label,
          icon: getNodeIcon(node.type),
          type: 'waypoint',
        });
      }
    });

    return result;
  }, [safePath, startLabel, endLabel]);

  if (safePath.length === 0) return null;

  const estimatedTimeSeconds = Math.ceil(distance / WALKING_SPEED);
  const minutes = Math.floor(estimatedTimeSeconds / 60);
  const seconds = estimatedTimeSeconds % 60;

  return (
    <div className="route-info-container">
      {/* SUMMARY */}
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

        {/* ENDPOINTS */}
        <div className="route-endpoints">
          <div className="endpoint start-point">
            <MapPin size={16} className="endpoint-icon" />
            <div className="endpoint-text">
              <span className="endpoint-label">FROM</span>
              <span className="endpoint-name" title={startLabel}>
                {startLabel}
              </span>
            </div>
          </div>

          <ArrowRight size={16} className="route-arrow" />

          <div className="endpoint end-point">
            <Navigation size={16} className="endpoint-icon" />
            <div className="endpoint-text">
              <span className="endpoint-label">TO</span>
              <span className="endpoint-name" title={endLabel}>
                {endLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DIRECTIONS */}
      <div className="directions-list">
        <h4 className="directions-title">TURN-BY-TURN DIRECTIONS</h4>

        {directions.map((direction) => {
          const Icon = direction.icon;
          return (
            <div
              key={direction.step}
              className={`direction-item ${direction.type}`}
            >
              <span className="step-number">{direction.step}</span>

              <Icon size={18} className="direction-icon" />

              <span
                className="direction-text"
                title={direction.instruction}
              >
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
