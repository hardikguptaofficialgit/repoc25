import { nodes } from '../data/buildingData';

/**
 * Calculates Euclidean distance between two points
 */
const getDistance = (n1, n2) => {
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculates the angle change between three points (p1 -> p2 -> p3)
 * Returns value in degrees
 * (+) -> Right Turn
 * (-) -> Left Turn
 */
const getTurnAngle = (p1, p2, p3) => {
    const a1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const a2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let diff = a2 - a1;

    // Normalize to [-PI, PI]
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    return diff * (180 / Math.PI);
};

/**
 * Generates textual navigation instructions from a path of node IDs.
 */
export const generateNavigationInstructions = (pathIds) => {
    if (!pathIds || pathIds.length < 2) return [];

    const instructions = [];
    const pathNodes = pathIds.map(id => nodes[id]).filter(Boolean);

    // 1. Initial Instruction
    const startNode = pathNodes[0];
    let accumulatedDistance = 0;

    instructions.push({
        type: 'start',
        text: `Start at ${startNode.label}`,
        nodeId: pathIds[0]
    });

    // Scan for turns and accumulate distances between them
    for (let i = 0; i < pathNodes.length - 1; i++) {
        const p1 = pathNodes[i];
        const p2 = pathNodes[i + 1];

        const dist = getDistance(p1, p2);
        accumulatedDistance += dist;

        // Check if there's a turn at the next node
        if (i < pathNodes.length - 2) {
            const p3 = pathNodes[i + 2];
            const angle = getTurnAngle(p1, p2, p3);

            // Turn Logic (Threshold 35 degrees)
            let turnType = null;
            if (angle > 35) turnType = 'right';
            else if (angle < -35) turnType = 'left';

            if (turnType) {
                // Add straight instruction with accumulated distance
                if (accumulatedDistance >= 3) {
                    const steps = Math.round(accumulatedDistance * 0.2);
                    instructions.push({
                        type: 'straight',
                        text: `Go straight for approx ${steps} steps`,
                        nodeId: pathIds[i + 1]
                    });
                }

                // Add turn instruction
                const turnNode = pathNodes[i + 1];
                let locationName = "";
                if (turnNode.label && !turnNode.type.includes('corridor') && turnNode.label.length > 3) {
                    locationName = ` at ${turnNode.label}`;
                }

                instructions.push({
                    type: `turn-${turnType}`,
                    text: `Turn ${turnType}${locationName}`,
                    nodeId: pathIds[i + 1]
                });

                // Reset accumulated distance after turn
                accumulatedDistance = 0;
            }
        }
    }

    // Add final straight segment if there's remaining distance
    if (accumulatedDistance >= 3) {
        const steps = Math.round(accumulatedDistance * 0.2);
        instructions.push({
            type: 'straight',
            text: `Go straight for approx ${steps} steps`,
            nodeId: pathIds[pathIds.length - 1]
        });
    }

    // Final arrival
    const endNode = pathNodes[pathNodes.length - 1];
    instructions.push({
        type: 'end',
        text: `Arrive at ${endNode.label}`,
        nodeId: pathIds[pathIds.length - 1]
    });

    return instructions;
};

/**
 * Generate navigation instructions for multi-floor path
 * @param {Object} multiFloorPath - Result from createMultiFloorPath
 * @returns {Array} Array of instruction objects with floor info
 */
export const generateMultiFloorInstructions = (multiFloorPath) => {
    if (!multiFloorPath || multiFloorPath.isSingleFloor) {
        // Use regular single-floor instructions
        if (multiFloorPath.segments && multiFloorPath.segments[0]) {
            return generateNavigationInstructions(multiFloorPath.segments[0].path);
        }
        return [];
    }
    
    const allInstructions = [];
    
    multiFloorPath.segments.forEach((segment, segmentIndex) => {
        if (segment.type === 'to_transition') {
            // Navigate to stairs/lift on source floor
            const segmentInstructions = generateNavigationInstructions(segment.path);
            
            // Add floor info to each instruction
            segmentInstructions.forEach((instruction, index) => {
                allInstructions.push({
                    ...instruction,
                    floor: segment.floor,
                    segmentIndex: segmentIndex,
                    isFloorTransition: false
                });
            });
            
        } else if (segment.type === 'transition') {
            // Floor change instruction
            const floorText = segment.targetFloor === 0 ? 'Ground Floor' : `Floor ${segment.targetFloor}`;
            const transitionText = segment.transitionType === 'stairs' ? 'stairs' : 'lift';
            
            allInstructions.push({
                type: 'floor_change',
                text: `Take ${transitionText} to ${floorText}`,
                nodeId: segment.transitionNode,
                floor: segment.floor,
                targetFloor: segment.targetFloor,
                transitionType: segment.transitionType,
                transitionLabel: segment.transitionLabel,
                segmentIndex: segmentIndex,
                isFloorTransition: true
            });
            
        } else if (segment.type === 'from_transition') {
            // Navigate from stairs/lift to destination on target floor
            const segmentInstructions = generateNavigationInstructions(segment.path);
            
            // Skip the first instruction (it's the transition point itself)
            segmentInstructions.slice(1).forEach((instruction, index) => {
                allInstructions.push({
                    ...instruction,
                    floor: segment.floor,
                    segmentIndex: segmentIndex,
                    isFloorTransition: false
                });
            });
        }
    });
    
    return allInstructions;
};
