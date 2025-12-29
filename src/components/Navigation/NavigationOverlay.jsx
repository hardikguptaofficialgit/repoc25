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
    Navigation as NavIcon,
    ChevronDown,
    ChevronUp,
    Building
} from 'lucide-react';
import { generateNavigationInstructions } from '../../utils/navigationInstructions';
import './NavigationOverlay.css';

const NavigationOverlay = ({ path, isMinimized, onToggleMinimize, crossFloorPhase, crossFloorNavigation, currentFloor }) => {
    const [instructions, setInstructions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (path && path.length > 0) {
            // Determine which floor to use for labels
            let floor = currentFloor;
            if (crossFloorNavigation && crossFloorPhase === 1) {
                floor = crossFloorNavigation.startFloor;
            } else if (crossFloorNavigation && crossFloorPhase === 3) {
                floor = crossFloorNavigation.endFloor;
            }
            
            const steps = generateNavigationInstructions(path, floor);
            
            // If cross-floor navigation, modify instructions based on phase
            if (crossFloorNavigation && crossFloorPhase) {
                if (crossFloorPhase === 1) {
                    // Phase 1: Modify destination text to indicate lift/stairs
                    const modifiedSteps = steps.map((step, idx) => {
                        if (idx === steps.length - 1 && step.type === 'end') {
                            return {
                                ...step,
                                text: `Arrive at ${crossFloorNavigation.transitionType === 'lift' ? 'Lift' : 'Stairs'}`,
                                type: 'transition-point'
                            };
                        }
                        return step;
                    });
                    setInstructions(modifiedSteps);
                } else if (crossFloorPhase === 3) {
                    // Phase 3: Add context that we're on a new floor
                    const modifiedSteps = steps.map((step, idx) => {
                        if (idx === 0 && step.type === 'start') {
                            return {
                                ...step,
                                text: `Continue from ${crossFloorNavigation.transitionType === 'lift' ? 'Lift' : 'Stairs'}`,
                                type: 'continue'
                            };
                        }
                        return step;
                    });
                    setInstructions(modifiedSteps);
                } else {
                    setInstructions(steps);
                }
            } else {
                setInstructions(steps);
            }
            setCurrentStep(0);
        } else {
            setInstructions([]);
        }
    }, [path, crossFloorPhase, crossFloorNavigation, currentFloor]);

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
            case 'continue': return MapPin;
            case 'straight': return ArrowUp;
            case 'turn-left': return CornerUpLeft;
            case 'turn-right': return CornerUpRight;
            case 'end': return CheckCircle;
            case 'transition-point': return Building;
            default: return NavIcon;
        }
    };

    const Icon = getIcon(step.type);

    return (
        <div className={`nav-overlay-integrated ${isMinimized ? 'minimized' : ''}`}>
            <div className={`nav-card-integrated ${step.type}`}>
                <div className="nav-progress">
                    <div
                        className="nav-progress-bar"
                        style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}
                    />
                </div>

                <div className="nav-content-integrated">
                    <div className="nav-icon-wrapper">
                        <Icon size={26} strokeWidth={2.5} />
                    </div>

                    <div className="nav-text">
                        <span className="step-count">Step {currentStep + 1} of {instructions.length}</span>
                        <h2 className="instruction-text">{step.text}</h2>
                    </div>

                    <div className="nav-controls">
                        <button
                            className="nav-btn prev"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                        >
                            <ChevronLeft size={22} strokeWidth={2.5} />
                        </button>
                        <button
                            className={`nav-btn next ${isLastStep ? 'finish' : ''}`}
                            onClick={nextStep}
                            disabled={isLastStep}
                        >
                            {isLastStep ? <Check size={22} strokeWidth={2.5} /> : <ChevronRight size={22} strokeWidth={2.5} />}
                        </button>
                    </div>

                    {onToggleMinimize && (
                        <button 
                            className="nav-minimize-btn"
                            onClick={onToggleMinimize}
                            title={isMinimized ? "Expand" : "Minimize"}
                        >
                            {isMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NavigationOverlay;
