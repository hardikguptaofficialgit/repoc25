import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Search, Building, ChevronRight, ChevronLeft, Footprints } from 'lucide-react';
import './TutorialGuide.css';

const tutorialSteps = [
    {
        icon: <Search size={32} />,
        title: "Search Locations",
        description: "Use the search bar to find classrooms, labs, offices, and other locations in the building. Just type the room name or number."
    },
    {
        icon: <MapPin size={32} />,
        title: "Set Your Route",
        description: "Enter your starting point and destination. You can also tap directly on the map to select locations."
    },
    {
        icon: <Navigation size={32} />,
        title: "Get Directions",
        description: "The app will calculate the shortest path and show you step-by-step navigation instructions."
    },
    {
        icon: <Building size={32} />,
        title: "Switch Floors",
        description: "Use the floor selector in the top-right corner to navigate between different floors of the building."
    },
    {
        icon: <Footprints size={32} />,
        title: "Quick Actions",
        description: "Use quick action buttons to find the nearest washroom, exit, or other facilities from your current location."
    }
];

const TutorialGuide = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 50);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Store in localStorage so it doesn't show again
        localStorage.setItem('tutorialShown', 'true');
        setTimeout(() => onClose(), 300);
    };

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        handleClose();
    };

    const step = tutorialSteps[currentStep];
    const isLastStep = currentStep === tutorialSteps.length - 1;

    return (
        <div className={`tutorial-overlay ${isVisible ? 'visible' : ''}`}>
            <div className={`tutorial-modal ${isVisible ? 'visible' : ''}`}>
                {/* Close button */}
                <button className="tutorial-close" onClick={handleClose}>
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="tutorial-header">
                    <span className="tutorial-badge">Welcome to C25Go</span>
                </div>

                {/* Step content */}
                <div className="tutorial-content">
                    <div className="tutorial-icon">
                        {step.icon}
                    </div>
                    <h2 className="tutorial-title">{step.title}</h2>
                    <p className="tutorial-description">{step.description}</p>
                </div>

                {/* Progress dots */}
                <div className="tutorial-progress">
                    {tutorialSteps.map((_, index) => (
                        <button
                            key={index}
                            className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                            onClick={() => setCurrentStep(index)}
                        />
                    ))}
                </div>

                {/* Navigation buttons */}
                <div className="tutorial-actions">
                    {currentStep > 0 ? (
                        <button className="tutorial-btn secondary" onClick={handlePrev}>
                            <ChevronLeft size={18} />
                            Back
                        </button>
                    ) : (
                        <button className="tutorial-btn skip" onClick={handleSkip}>
                            Skip
                        </button>
                    )}
                    
                    <button className="tutorial-btn primary" onClick={handleNext}>
                        {isLastStep ? "Get Started" : "Next"}
                        {!isLastStep && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialGuide;
