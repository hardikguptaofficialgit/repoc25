import React, { useState, useEffect, useMemo } from 'react';
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
    Building,
    ArrowUpDown
} from 'lucide-react';

import { generateNavigationInstructions } from '../../utils/navigationInstructions';
import './NavigationOverlay.css';

const NavigationOverlay = ({
    path = [],
    isMinimized,
    onToggleMinimize,
    crossFloorPhase,
    crossFloorNavigation,
    currentFloor,
    onNextPhase,
    onPrevPhase,
    startFloor,
    endFloor,
    currentStep = 0,
    setCurrentStep = () => { }
}) => {

    const activeFloor = useMemo(() => {
        if (!crossFloorNavigation) return currentFloor;
        if (crossFloorPhase === 1) return crossFloorNavigation.startFloor;
        if (crossFloorPhase === 3) return crossFloorNavigation.endFloor;
        return currentFloor;
    }, [crossFloorNavigation, crossFloorPhase, currentFloor]);

    const instructions = useMemo(() => {
        if (!path.length) return [];

        let base = generateNavigationInstructions(path, activeFloor);

        if (!crossFloorNavigation) return base;

        if (crossFloorPhase === 1) {
            return base.map((step, i) =>
                i === base.length - 1 && step.type === 'end'
                    ? {
                        ...step,
                        type: 'transition-point',
                        text: `Arrive at ${crossFloorNavigation.transitionType === 'lift' ? 'Lift' : 'Stairs'}`
                    }
                    : step
            );
        }

        if (crossFloorPhase === 3) {
            return base.map((step, i) =>
                i === 0 && step.type === 'start'
                    ? {
                        ...step,
                        type: 'continue',
                        text: `Continue from ${crossFloorNavigation.transitionType === 'lift' ? 'Lift' : 'Stairs'}`
                    }
                    : step
            );
        }

        return base;
    }, [path, activeFloor, crossFloorNavigation, crossFloorPhase]);

    // Calculate progress percent - must be before any early returns (hooks rule)
    const safeStep = Math.max(0, Math.min(currentStep, instructions.length - 1));
    const progressPercent = useMemo(() => {
        const base = ((safeStep + 1) / instructions.length) * 100;
        if (!crossFloorNavigation) return base;
        if (crossFloorPhase === 1) return base * 0.33;
        if (crossFloorPhase === 3) return 66 + base * 0.34;
        return base;
    }, [safeStep, instructions.length, crossFloorNavigation, crossFloorPhase]);

    // No local currentStep state; controlled by parent

    // -------- PHASE 2 (FLOOR TRANSITION UI) --------
    if (crossFloorNavigation && crossFloorPhase === 2) {
        const src = crossFloorNavigation.startFloor ?? startFloor;
        const dst = crossFloorNavigation.endFloor ?? endFloor;
        return (
            <div className={`nav-overlay-integrated ${isMinimized ? 'minimized' : ''}`}>
                <div className="nav-card-integrated transition-phase">
                    <div className="nav-progress">
                        <div className="nav-progress-bar transition-progress" style={{ width: '66%' }} />
                    </div>
                    <div className="nav-content-integrated">
                        <div className="nav-icon-wrapper floor-change">
                            <ArrowUpDown size={26} strokeWidth={2.5} />
                        </div>
                        <div className="nav-text">
                            <span className="step-count floor-change-label">
                                Floor {src === 0 ? 'G' : src} → Floor {dst === 0 ? 'G' : dst}
                            </span>
                            <h2 className="instruction-text">
                                Take {crossFloorNavigation.transitionType === 'lift' ? 'Lift' : 'Stairs'}
                            </h2>
                        </div>
                        <button className="nav-btn floor-reached-btn" onClick={onNextPhase}>
                            <Check size={22} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!instructions.length) return null;

    // Get current step and check if it's the last one
    const step = instructions[safeStep];
    const isLast = safeStep === instructions.length - 1;
    const isTransitionEnd = crossFloorNavigation && crossFloorPhase === 1 && isLast;

    const getIcon = (type) => {
        switch (type) {
            case 'start':
            case 'continue':
                return MapPin;
            case 'straight':
                return ArrowUp;
            case 'turn-left':
                return CornerUpLeft;
            case 'turn-right':
                return CornerUpRight;
            case 'end':
                return CheckCircle;
            case 'transition-point':
                return Building;
            default:
                return NavIcon;
        }
    };

    const Icon = getIcon(step.type);

    return (
        <div className={`nav-overlay-integrated ${isMinimized ? 'minimized' : ''}`}>
            <div className={`nav-card-integrated ${step.type} ${crossFloorNavigation ? 'multi-floor' : ''}`}>
                {crossFloorNavigation && (
                    <div className="multi-floor-badge">
                        Floor {activeFloor === 0 ? 'G' : activeFloor}
                    </div>
                )}
                <div className="nav-progress">
                    <div
                        className={`nav-progress-bar ${crossFloorNavigation ? 'multi-floor-progress' : ''}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="nav-content-integrated">
                    <div className="nav-icon-wrapper">
                        <Icon size={26} strokeWidth={2.5} />
                    </div>
                    <div className="nav-text">
                        <span className="step-count">
                            Step {safeStep + 1} of {instructions.length}
                        </span>
                        <h2 className="instruction-text">{step.text}</h2>
                    </div>
                    <div className="nav-controls">
                        <button
                            className="nav-btn prev"
                            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                            disabled={safeStep === 0}
                        >
                            <ChevronLeft size={22} />
                        </button>
                        {isTransitionEnd ? (
                            <button className="nav-btn next-phase" onClick={onNextPhase}>
                                <ArrowUpDown size={20} />
                            </button>
                        ) : (
                            <button
                                className={`nav-btn next ${isLast ? 'finish' : ''}`}
                                onClick={() => setCurrentStep(s => Math.min(instructions.length - 1, s + 1))}
                                disabled={isLast && !crossFloorNavigation || instructions.length === 0}
                            >
                                {isLast ? <Check size={22} /> : <ChevronRight size={22} />}
                            </button>
                        )}
                    </div>
                    {onToggleMinimize && (
                        <button className="nav-minimize-btn" onClick={onToggleMinimize}>
                            {isMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    )}
                </div>
                {crossFloorNavigation && crossFloorPhase === 1 && !isTransitionEnd && (
                    <button className="skip-to-transition" onClick={onNextPhase}>
                        <ArrowUpDown size={14} />
                        <span>
                            Skip to {crossFloorNavigation.transitionType === 'lift' ? 'Lift' : 'Stairs'}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );

};


export default NavigationOverlay;
