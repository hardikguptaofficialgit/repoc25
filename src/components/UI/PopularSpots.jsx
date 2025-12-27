import React from 'react';
import './PopularSpots.css';

const PopularSpots = ({ onSelect }) => {
    const spots = [
        { id: 'cafe', label: 'Cafe' },
        { id: 'library', label: 'Library' }
    ];

    return (
        <div className="popular-spots-container">
            <h3 className="section-label">POPULAR SPOTS</h3>
            <div className="spots-chips">
                {spots.map(spot => (
                    <button
                        key={spot.id}
                        className="spot-chip"
                        onClick={() => onSelect(spot)}
                    >
                        {spot.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PopularSpots;
