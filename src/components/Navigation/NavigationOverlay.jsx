import React, { useState, useEffect } from 'react';
import {
    MapPin,
    ArrowUp,
    Check,
    CornerUpLeft,
    CornerUpRight,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Navigation as NavIcon
} from 'lucide-react';
import { generateNavigationInstructions } from '../../utils/navigationInstructions';
import './NavigationOverlay.css';

const NavigationOverlay = ({ path }) => {
    const [instructions, setInstructions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (path && path.length > 0) {
            const steps = generateNavigationInstructions(path);
            setInstructions(steps);
            setCurrentStep(0);
        } else {
            setInstructions([]);
        }
    }, [path]);

    if (!instructions.length) return null;

    const step = instructions[currentStep];
    const isLastStep = currentStep === instructions.length - 1;

    const nextStep = () => {
        if (currentStep < instructions.length - 1) {
            setCurrentStep(c => c + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'start': return MapPin;
            case 'straight': return ArrowUp;
            case 'turn-left': return CornerUpLeft;
            case 'turn-right': return CornerUpRight;
            case 'end': return CheckCircle; // or NavIcon
            default: return NavIcon;
        }
    };

    const Icon = getIcon(step.type);

    return (
        <div className="nav-overlay-container">
            <div className={`nav-card ${step.type}`}>
                <div className="nav-progress">
                    <div
                        className="nav-progress-bar"
                        style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}
                    />
                </div>

                <div className="nav-content">
                    <div className="nav-text">
                        <span className="step-count">Step {currentStep + 1} of {instructions.length}</span>
                        <h2 className="instruction-text">
                            <Icon size={24} className="guiding-arrow" strokeWidth={3} />
                            {step.text}
                        </h2>
                    </div>

                    <div className="nav-controls">
                        <button
                            className="nav-btn prev"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            className={`nav-btn next ${isLastStep ? 'finish' : ''}`}
                            onClick={nextStep}
                            disabled={isLastStep && currentStep === instructions.length - 1} // Keep finish state or disable?
                        >
                            {isLastStep ? <Check size={24} /> : <ChevronRight size={24} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavigationOverlay;
