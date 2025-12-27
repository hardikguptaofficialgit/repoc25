import React from 'react';
import './CampusOverview.css';

const CampusOverview = () => {
    const stats = [
        {
            id: 'floors',
            label: 'Floors',
            value: '4',
            color: '#ff5c00'
        },
        {
            id: 'rooms',
            label: 'Rooms',
            value: '46',
            color: '#ff5c00'
        },
        {
            id: 'pois',
            label: 'POIs',
            value: '32',
            color: '#ff5c00'
        }
    ];

    return (
        <div className="campus-overview-container animate-fade-in">
            <h3 className="section-title">Campus Overview</h3>
            <div className="overview-grid">
                {stats.map((stat) => (
                    <div key={stat.id} className="overview-card">
                        <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CampusOverview;
