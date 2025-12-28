import React from 'react';
import { ArrowUpDown, MoveVertical } from 'lucide-react';
import './FloorTransitionChoice.css';

/**
 * FloorTransitionChoice - UI for selecting stairs or lift for floor changes
 */
function FloorTransitionChoice({ transitions, onSelect, onCancel }) {
  const { stairs, lift } = transitions;
  
  if (!stairs && !lift) {
    return (
      <div className="transition-choice-overlay">
        <div className="transition-choice-card">
          <h3>No Floor Transition Available</h3>
          <p>Cannot find stairs or lift for floor change</p>
          <button onClick={onCancel} className="choice-btn cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="transition-choice-overlay">
      <div className="transition-choice-card">
        <h3>Choose Floor Transition</h3>
        <p className="transition-subtitle">How would you like to change floors?</p>
        
        <div className="choice-buttons">
          {stairs && (
            <button 
              className="choice-btn stairs-btn"
              onClick={() => onSelect('stairs')}
            >
              <MoveVertical className="choice-icon" />
              <div className="choice-info">
                <span className="choice-label">Take Stairs</span>
                <span className="choice-detail">{stairs.label}</span>
                <span className="choice-distance">
                  ~{Math.round(stairs.distance * 0.2)} steps away
                </span>
              </div>
            </button>
          )}
          
          {lift && (
            <button 
              className="choice-btn lift-btn"
              onClick={() => onSelect('lift')}
            >
              <ArrowUpDown className="choice-icon" />
              <div className="choice-info">
                <span className="choice-label">Take Lift</span>
                <span className="choice-detail">{lift.label}</span>
                <span className="choice-distance">
                  ~{Math.round(lift.distance * 0.2)} steps away
                </span>
              </div>
            </button>
          )}
        </div>
        
        <button onClick={onCancel} className="choice-btn cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default FloorTransitionChoice;
