import React from 'react';
import './DeveloperAttribution.css';

const HARVIX_LOGO_URL = 'https://strykerinside.vercel.app/harvix_logo.png';
const HARVIX_SITE_URL = 'https://strykerinside.vercel.app';

const DeveloperAttribution = ({ className = '' }) => (
    <div className={`developer-attribution ${className}`.trim()}>
        Developed by{' '}
        <a
            href={HARVIX_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="developer-logo-link"
            aria-label="Visit Harvix website"
        >
            <img
                src={HARVIX_LOGO_URL}
                alt="Harvix"
                className="developer-logo"
            />
        </a>
    </div>
);

export default DeveloperAttribution;
