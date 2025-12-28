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
    ArrowUpDown,
    MoveVertical
} from 'lucide-react';
import { generateMultiFloorInstructions } from '../../utils/navigationInstructions';
import './NavigationOverlay.css';

const NavigationOverlay = ({ 
    path, 
    multiFloorPath, 
    isMinimized, 
    onToggleMinimize,
    onFloorChange 
}) => {
    const [instructions, setInstructions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (multiFloorPath) {
            // Use multi-floor instructions
            const steps = generateMultiFloorInstructions(multiFloorPath);
            setInstructions(steps);
            setCurrentStep(0);
        } else if (path && path.length > 0) {
            // Fallback to single-floor path
            const steps = generateMultiFloorInstructions({
                isSingleFloor: true,
                segments: [{ path, floor: 0 }]
            });
            setInstructions(steps);
            setCurrentStep(0);
        } else {
            setInstructions([]);
        }
    }, [path, multiFloorPath]);

    // Auto-switch floor and path when stepping through multi-floor navigation
    useEffect(() => {
        if (instructions.length > 0 && currentStep < instructions.length) {
            const instruction = instructions[currentStep];
            
            // Update floor and path based on current instruction
            if (instruction.floor !== undefined && onFloorChange) {
                onFloorChange(instruction.floor, instruction.segmentIndex);
            }
            
            // When on a floor transition step, prepare for next floor
            if (instruction.isFloorTransition && instruction.targetFloor !== undefined) {
                // The NEXT step after transition will be on the new floor
                // So we switch the floor on the transition step itself
                if (onFloorChange) {
                    onFloorChange(instruction.targetFloor, instruction.segmentIndex + 1);
                }
            }
        }
    }, [currentStep, instructions, onFloorChange]);

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
            case 'end': return CheckCircle;
            case 'floor_change': return step.transitionType === 'stairs' ? MoveVertical : ArrowUpDown;
            default: return NavIcon;
        }
    };

    const Icon = getIcon(step.type);
    
    // Show floor indicator for multi-floor navigation
    const showFloorInfo = step.floor !== undefined;
    const floorLabel = step.floor === 0 ? 'GF' : `${step.floor}F`;

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
                        <Icon size={28} strokeWidth={2.5} />
                    </div>

                    <div className="nav-text">
                        <div className="step-header">
                            <span className="step-count">Step {currentStep + 1} of {instructions.length}</span>
                            {showFloorInfo && (
                                <span className="floor-badge">{floorLabel}</span>
                            )}
                        </div>
                        <h2 className="instruction-text">{step.text}</h2>
                        {step.isFloorTransition && (
                            <p className="floor-transition-hint">
                                Map will switch to {step.targetFloor === 0 ? 'Ground Floor' : `Floor ${step.targetFloor}`}
                            </p>
                        )}
                    </div>

                    <div className="nav-controls">
                        <button
                            className="nav-btn prev"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className={`nav-btn next ${isLastStep ? 'finish' : ''}`}
                            onClick={nextStep}
                            disabled={isLastStep}
                        >
                            {isLastStep ? <Check size={20} /> : <ChevronRight size={20} />}
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
