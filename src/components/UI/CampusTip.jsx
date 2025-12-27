import React from 'react';
import { Lightbulb } from 'lucide-react';
import './CampusTip.css';

const CampusTip = () => {
    return (
        <div className="campus-tip-card">
            <div className="tip-header">
                <Lightbulb className="tip-icon" size={20} fill="#FFD700" color="#FFD700" />
                <span className="tip-title">CAMPUS TIP</span>
            </div>
            <p className="tip-content">
                Use <strong>Quick Nav</strong> to find amenities like Lifts or Washrooms instantly.
            </p>
        </div>
    );
};

export default CampusTip;
