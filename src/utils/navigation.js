/**
 * Generates human-readable navigation instructions from a path of node IDs.
 * @param {Array<string>} path - Array of node IDs
 * @param {Object} nodes - Map of node objects {id: {x, y, label, type}}
 * @returns {Array<Object>} - Array of instruction objects { text, icon, subtext }
 */
export function generateRouteInstructions(path, nodes) {
    if (!path || path.length < 2 || !nodes) return [];

    const instructions = [];
    let currentSegmentLength = 0;

    // Start Instruction
    const startNode = nodes[path[0]];
    instructions.push({
        type: 'start',
        text: `Start at ${startNode.label || startNode.type}`,
        icon: 'map-pin'
    });

    for (let i = 0; i < path.length - 1; i++) {
        const currentId = path[i];
        const nextId = path[i + 1];
        const currentNode = nodes[currentId];
        const nextNode = nodes[nextId];

        // Calculate distance
        const dist = Math.sqrt(
            Math.pow(nextNode.x - currentNode.x, 2) +
            Math.pow(nextNode.y - currentNode.y, 2)
        );
        // Approximate pixel-to-meter ratio (e.g., 20px = 1m)
        const meters = Math.round(dist / 20);

        // Check for specific transition types
        if (nextNode.type === 'stairs' && currentNode.type !== 'stairs') {
            if (currentSegmentLength > 0) {
                instructions.push({
                    type: 'walk',
                    text: `Walk ${currentSegmentLength}m`,
                    icon: 'footprints'
                });
                currentSegmentLength = 0;
            }
            instructions.push({
                type: 'stairs',
                text: "Take the stairs",
                icon: 'arrow-up-circle'
            });
        }
        else if (nextNode.type === 'lift' && currentNode.type !== 'lift') {
            if (currentSegmentLength > 0) {
                instructions.push({
                    type: 'walk',
                    text: `Walk ${currentSegmentLength}m`,
                    icon: 'footprints'
                });
                currentSegmentLength = 0;
            }
            instructions.push({
                type: 'lift',
                text: "Take the lift",
                icon: 'move-vertical'
            });
        }
        else {
            // It's a walking segment
            currentSegmentLength += meters;

            // If the next node is significant (a landmark), maybe mention it?
            // For now, we accumulate distance until a turn or type change

            // Simple heuristic for turns could be added here later using 3 points
        }
    }

    // Add remaining walk
    if (currentSegmentLength > 0) {
        instructions.push({
            type: 'walk',
            text: `Walk ${currentSegmentLength}m`,
            icon: 'footprints'
        });
    }

    // End Instruction
    const endNode = nodes[path[path.length - 1]];
    instructions.push({
        type: 'arrive',
        text: `Arrive at ${endNode.label || endNode.type}`,
        icon: 'flag'
    });

    return instructions;
}
