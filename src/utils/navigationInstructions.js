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
    let currentDistance = 0;

    const addStraightInstruction = (dist, nodeId) => {
        if (dist >= 3) { // Only show straight for detectable distance
            const pixels = dist;
            const steps = Math.round(pixels * 0.2); // Approx 0.2 steps per pixel unit
            instructions.push({
                type: 'straight',
                text: `Go straight for approx ${steps} steps`,
                nodeId: nodeId
            });
        }
    };

    instructions.push({
        type: 'start',
        text: `Start at ${startNode.label}`,
        nodeId: pathIds[0]
    });

    for (let i = 0; i < pathNodes.length - 1; i++) {
        const p1 = pathNodes[i];
        const p2 = pathNodes[i + 1];

        const dist = getDistance(p1, p2);
        currentDistance += dist;

        if (i < pathNodes.length - 2) {
            const p3 = pathNodes[i + 2];
            const angle = getTurnAngle(p1, p2, p3);

            // Turn Logic (Threshold 35 degrees)
            let turnType = null;
            if (angle > 35) turnType = 'right';
            else if (angle < -35) turnType = 'left';

            if (turnType) {
                // We are at p2 turning towards p3

                // 1. Flush the straight segment leading to this turn
                addStraightInstruction(currentDistance, pathIds[i + 1]);
                currentDistance = 0;

                // 2. Add the Turn Instruction
                const turnNode = pathNodes[i + 1];
                let locationName = "";

                // If the node itself has a meaningful label (not just a corridor/code)
                if (turnNode.label && !turnNode.type.includes('corridor') && turnNode.label.length > 3) {
                    locationName = ` at ${turnNode.label}`;
                }
                // We could also look for nearby landmarks in a real spatial graph, 
                // but for now we rely on the node's own label.

                instructions.push({
                    type: `turn-${turnType}`,
                    text: `Turn ${turnType}${locationName}`,
                    nodeId: pathIds[i + 1]
                });
            }
        }
    }

    // Flush remaining straight distance after the last turn
    addStraightInstruction(currentDistance, pathIds[pathIds.length - 1]);

    // Final arrival
    const endNode = pathNodes[pathNodes.length - 1];
    instructions.push({
        type: 'end',
        text: `Arrive at ${endNode.label}`,
        nodeId: pathIds[pathIds.length - 1]
    });

    return instructions;
};
