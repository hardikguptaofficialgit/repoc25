import { nodes } from '../data/buildingData';

/**
 * Returns floor-adjusted room label
 */
const getFloorAdjustedLabel = (node, floor) => {
    if (!node?.label) return '';

    const match = node.label.match(/^([A-Z])-(\d{3})$/);
    if (!match || floor == null) return node.label;

    const block = match[1];
    const baseRoom = parseInt(match[2], 10);

    // Example: floor 2, room 015 → 215
    const adjustedRoom =
        floor === 0 ? baseRoom : floor * 100 + (baseRoom % 100);

    return `${block}-${adjustedRoom.toString().padStart(3, '0')}`;
};

/**
 * Euclidean distance
 */
const getDistance = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.hypot(dx, dy);
};

/**
 * Angle between vectors (p1 → p2 → p3)
 * Positive = right, Negative = left
 */
const getTurnAngle = (p1, p2, p3) => {
    const v1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const v2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);

    let delta = v2 - v1;
    while (delta <= -Math.PI) delta += 2 * Math.PI;
    while (delta > Math.PI) delta -= 2 * Math.PI;

    return (delta * 180) / Math.PI;
};

/**
 * Generates turn-by-turn navigation instructions
 */
export const generateNavigationInstructions = (pathIds = [], floor) => {
    if (pathIds.length < 2) return [];

    const path = pathIds.map(id => nodes[id]).filter(Boolean);
    if (path.length < 2) return [];

    const instructions = [];
    let distanceBuffer = 0;
    let straightStartIndex = 0; // Track where the current straight segment starts

    const MIN_STRAIGHT_DISTANCE = 3; // meters
    const TURN_THRESHOLD = 35; // degrees
    const STEP_FACTOR = 0.2;

    // START
    instructions.push({
        type: 'start',
        text: `Start at ${getFloorAdjustedLabel(path[0], floor)}`,
        nodeId: pathIds[0],
        startEdgeIndex: -1, // No edge for start
        endEdgeIndex: -1,
    });

    straightStartIndex = 0; // Start tracking from first edge

    for (let i = 0; i < path.length - 1; i++) {
        const curr = path[i];
        const next = path[i + 1];

        distanceBuffer += getDistance(curr, next);

        if (i < path.length - 2) {
            const afterNext = path[i + 2];
            const angle = getTurnAngle(curr, next, afterNext);

            let turn = null;
            if (angle > TURN_THRESHOLD) turn = 'right';
            else if (angle < -TURN_THRESHOLD) turn = 'left';

            if (turn) {
                if (distanceBuffer >= MIN_STRAIGHT_DISTANCE) {
                    instructions.push({
                        type: 'straight',
                        text: `Go straight for approx ${Math.round(
                            distanceBuffer * STEP_FACTOR
                        )} steps`,
                        nodeId: pathIds[i + 1],
                        startEdgeIndex: straightStartIndex,
                        endEdgeIndex: i, // Current edge index (i represents edge from path[i] to path[i+1])
                    });
                }

                const label = getFloorAdjustedLabel(next, floor);
                const atText =
                    next.type !== 'corridor' && label
                        ? ` at ${label}`
                        : '';

                instructions.push({
                    type: `turn-${turn}`,
                    text: `Turn ${turn}${atText}`,
                    nodeId: pathIds[i + 1],
                    startEdgeIndex: i + 1, // The turn happens at the next edge
                    endEdgeIndex: i + 1,
                });

                distanceBuffer = 0;
                straightStartIndex = i + 1; // Next straight starts after this turn
            }
        }
    }

    // FINAL STRAIGHT (if any)
    if (distanceBuffer >= MIN_STRAIGHT_DISTANCE) {
        instructions.push({
            type: 'straight',
            text: `Go straight for approx ${Math.round(
                distanceBuffer * STEP_FACTOR
            )} steps`,
            nodeId: pathIds[pathIds.length - 1],
            startEdgeIndex: straightStartIndex,
            endEdgeIndex: pathIds.length - 2, // Last edge
        });
    }

    // END
    instructions.push({
        type: 'end',
        text: `Arrive at ${getFloorAdjustedLabel(
            path[path.length - 1],
            floor
        )}`,
        nodeId: pathIds[pathIds.length - 1],
        startEdgeIndex: pathIds.length - 2, // Last edge leads to end
        endEdgeIndex: pathIds.length - 2,
    });

    return instructions;
};
