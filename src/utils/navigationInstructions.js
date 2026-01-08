import { nodes } from '../data/buildingData';

/**
 * Get floor-adjusted label for a node
 * @param {Object} node - The node object
 * @param {number} floor - The floor number
 * @returns {string} - The floor-adjusted label
 */
const getFloorAdjustedLabel = (node, floor) => {
    if (!node || !node.label) return '';
    
    // Check if label matches pattern like A-001, B-020, etc.
    const match = node.label.match(/^([A-Z])-(\d{3})$/);
    if (match && floor !== undefined && floor !== null) {
        const block = match[1];
        const roomNumber = parseInt(match[2]);
        
        if (floor === 0) {
            return `${block}-${roomNumber.toString().padStart(3, '0')}`;
        } else {
            const newRoomNumber = (floor * 100) + roomNumber;
            return `${block}-${newRoomNumber.toString().padStart(3, '0')}`;
        }
    }
    
    return node.label;
};

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
 * @param {Array} pathIds - Array of node IDs in the path
 * @param {number} floor - Optional floor number for label adjustment
 */
export const generateNavigationInstructions = (pathIds, floor) => {
    if (!pathIds || pathIds.length < 2) return [];

    const instructions = [];
    const pathNodes = pathIds.map(id => nodes[id]).filter(Boolean);

    // 1. Initial Instruction
    const startNode = pathNodes[0];
    const startLabel = getFloorAdjustedLabel(startNode, floor);
    let accumulatedDistance = 0;

    instructions.push({
        type: 'start',
        text: `Start at ${startLabel}`,
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
                const turnLabel = getFloorAdjustedLabel(turnNode, floor);
                let locationName = "";
                if (turnNode.label && !turnNode.type.includes('corridor') && turnNode.label.length > 3) {
                    locationName = ` at ${turnLabel}`;
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
    const endLabel = getFloorAdjustedLabel(endNode, floor);
    instructions.push({
        type: 'end',
        text: `Arrive at ${endLabel}`,
        nodeId: pathIds[pathIds.length - 1]
    });

    return instructions;
};
