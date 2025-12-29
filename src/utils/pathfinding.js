// Dijkstra's shortest path algorithm implementation

class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }

    dequeue() {
        return this.values.shift();
    }

    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }

    isEmpty() {
        return this.values.length === 0;
    }
}

/**
 * Find shortest path using Dijkstra's algorithm
 * @param {Object} graph - Adjacency list representation
 * @param {string} start - Starting node ID
 * @param {string} end - Ending node ID
 * @returns {Object} - { path: [], distance: number, error?: string }
 */
export function findShortestPath(graph, start, end) {
    // Edge case: Invalid inputs
    if (!graph) {
        return { path: [], distance: Infinity, error: 'Graph is not initialized' };
    }

    if (!start || !end) {
        return { path: [], distance: Infinity, error: 'Start and end locations are required' };
    }

    if (start === end) {
        return { path: [start], distance: 0, error: 'Start and destination are the same' };
    }

    if (!graph[start]) {
        return { path: [], distance: Infinity, error: 'Starting location not found in graph' };
    }

    if (!graph[end]) {
        return { path: [], distance: Infinity, error: 'Destination not found in graph' };
    }

    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();
    const visited = new Set();

    // Initialize distances
    for (let node in graph) {
        distances[node] = node === start ? 0 : Infinity;
        previous[node] = null;
    }

    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
        const { val: currentNode } = pq.dequeue();

        if (visited.has(currentNode)) continue;
        visited.add(currentNode);

        // Found the destination
        if (currentNode === end) {
            const path = [];
            let current = end;
            while (current) {
                path.unshift(current);
                current = previous[current];
            }

            // Validate path
            if (path.length === 0 || path[0] !== start || path[path.length - 1] !== end) {
                return { path: [], distance: Infinity, error: 'Invalid path generated' };
            }

            return { path, distance: Math.round(distances[end] * 10) / 10 };
        }

        // Check neighbors
        const neighbors = graph[currentNode] || [];
        for (let neighbor of neighbors) {
            const { node, weight } = neighbor;

            // Validate neighbor data
            if (!node || typeof weight !== 'number' || weight < 0) {
                console.warn(`Invalid neighbor data for ${currentNode}:`, neighbor);
                continue;
            }

            const newDistance = distances[currentNode] + weight;

            if (newDistance < distances[node]) {
                distances[node] = newDistance;
                previous[node] = currentNode;
                pq.enqueue(node, newDistance);
            }
        }
    }

    return { path: [], distance: Infinity, error: 'No path found between these locations' };
}

/**
 * Find nearest POI of a specific type
 * @param {Object} graph - Adjacency list representation
 * @param {string} start - Starting node ID
 * @param {Array} targetNodes - Array of target node IDs
 * @returns {Object} - { target: string, path: [], distance: number, error?: string }
 */
export function findNearestPOI(graph, start, targetNodes) {
    // Edge case: Invalid inputs
    if (!graph) {
        return { target: null, path: [], distance: Infinity, error: 'Graph is not initialized' };
    }

    if (!start) {
        return { target: null, path: [], distance: Infinity, error: 'Starting location is required' };
    }

    if (!graph[start]) {
        return { target: null, path: [], distance: Infinity, error: 'Starting location not found' };
    }

    if (!targetNodes || !Array.isArray(targetNodes) || targetNodes.length === 0) {
        return { target: null, path: [], distance: Infinity, error: 'No target locations available' };
    }

    let shortestPath = null;
    let shortestDistance = Infinity;
    let nearestTarget = null;
    let validTargetsFound = 0;

    for (let target of targetNodes) {
        // Skip invalid targets
        if (!target || !graph[target]) {
            console.warn(`Invalid target node: ${target}`);
            continue;
        }

        // Skip if target is the same as start
        if (target === start) {
            continue;
        }

        const result = findShortestPath(graph, start, target);

        // Only consider valid paths without errors
        if (!result.error && result.distance < shortestDistance && result.path.length > 0) {
            shortestDistance = result.distance;
            shortestPath = result.path;
            nearestTarget = target;
            validTargetsFound++;
        }
    }

    if (!nearestTarget || !shortestPath) {
        return {
            target: null,
            path: [],
            distance: Infinity,
            error: validTargetsFound === 0 ? 'No reachable locations found' : 'Unable to find path'
        };
    }

    return {
        target: nearestTarget,
        path: shortestPath,
        distance: shortestDistance,
    };
}

/**
 * Calculate Euclidean distance between two points
 * @param {Object} point1 - {x, y}
 * @param {Object} point2 - {x, y}
 * @returns {number}
 */
export function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the nearest lift or stairs from a starting node
 * @param {Object} graph - Adjacency list representation
 * @param {string} startNode - Starting node ID
 * @param {Object} nodes - All nodes data
 * @param {Object} floorNodes - Nodes available on the current floor
 * @returns {Object} - { liftPath, stairsPath, recommendedPath, recommendedType }
 */
export function findNearestTransition(graph, startNode, nodes, floorNodes) {
    // Get all lifts and stairs that exist on the current floor
    const lifts = Object.keys(floorNodes).filter(id => floorNodes[id]?.type === 'lift');
    const stairs = Object.keys(floorNodes).filter(id => floorNodes[id]?.type === 'stairs');
    
    let nearestLift = null;
    let nearestStairs = null;
    
    // Find nearest lift
    if (lifts.length > 0) {
        nearestLift = findNearestPOI(graph, startNode, lifts);
    }
    
    // Find nearest stairs
    if (stairs.length > 0) {
        nearestStairs = findNearestPOI(graph, startNode, stairs);
    }
    
    // Determine the recommended option (shortest distance)
    let recommendedPath = null;
    let recommendedType = null;
    
    if (nearestLift && !nearestLift.error && nearestStairs && !nearestStairs.error) {
        if (nearestLift.distance <= nearestStairs.distance) {
            recommendedPath = nearestLift;
            recommendedType = 'lift';
        } else {
            recommendedPath = nearestStairs;
            recommendedType = 'stairs';
        }
    } else if (nearestLift && !nearestLift.error) {
        recommendedPath = nearestLift;
        recommendedType = 'lift';
    } else if (nearestStairs && !nearestStairs.error) {
        recommendedPath = nearestStairs;
        recommendedType = 'stairs';
    }
    
    return {
        liftPath: nearestLift,
        stairsPath: nearestStairs,
        recommendedPath,
        recommendedType
    };
}

/**
 * Find corresponding transition node on target floor
 * Lifts and stairs have the same node IDs across floors
 * @param {string} transitionNodeId - The lift/stairs node ID on current floor
 * @param {Object} targetFloorNodes - Nodes on the target floor
 * @returns {string|null} - The corresponding node ID on target floor
 */
export function findCorrespondingTransitionNode(transitionNodeId, targetFloorNodes) {
    // Lifts and stairs typically have the same node ID across floors
    if (targetFloorNodes[transitionNodeId]) {
        return transitionNodeId;
    }
    return null;
}

/**
 * Calculate complete cross-floor route
 * @param {Object} graph - Adjacency list representation
 * @param {string} startNode - Starting node ID
 * @param {string} endNode - Destination node ID
 * @param {Object} nodes - All nodes data
 * @param {Object} startFloorNodes - Nodes on the starting floor
 * @param {Object} endFloorNodes - Nodes on the destination floor
 * @param {number} startFloor - Starting floor number
 * @param {number} endFloor - Destination floor number
 * @param {string} preferredTransition - Optional: 'lift' or 'stairs' to force a specific transition type
 * @returns {Object} - Cross-floor navigation result
 */
export function calculateCrossFloorRoute(graph, startNode, endNode, nodes, startFloorNodes, endFloorNodes, startFloor, endFloor, preferredTransition = null) {
    // Find nearest transition (lift/stairs) from start
    const transition = findNearestTransition(graph, startNode, nodes, startFloorNodes);
    
    // Build options for both lift and stairs
    const options = {
        lift: null,
        stairs: null
    };
    
    // Calculate lift option if available
    if (transition.liftPath && !transition.liftPath.error) {
        const liftNodeId = transition.liftPath.target;
        const targetLiftNode = findCorrespondingTransitionNode(liftNodeId, endFloorNodes);
        if (targetLiftNode) {
            const pathFromLift = findShortestPath(graph, targetLiftNode, endNode);
            if (!pathFromLift.error) {
                options.lift = {
                    transitionPath: transition.liftPath,
                    destinationPath: pathFromLift,
                    transitionNodeId: liftNodeId,
                    totalDistance: transition.liftPath.distance + pathFromLift.distance
                };
            }
        }
    }
    
    // Calculate stairs option if available
    if (transition.stairsPath && !transition.stairsPath.error) {
        const stairsNodeId = transition.stairsPath.target;
        const targetStairsNode = findCorrespondingTransitionNode(stairsNodeId, endFloorNodes);
        if (targetStairsNode) {
            const pathFromStairs = findShortestPath(graph, targetStairsNode, endNode);
            if (!pathFromStairs.error) {
                options.stairs = {
                    transitionPath: transition.stairsPath,
                    destinationPath: pathFromStairs,
                    transitionNodeId: stairsNodeId,
                    totalDistance: transition.stairsPath.distance + pathFromStairs.distance
                };
            }
        }
    }
    
    // Check if we have any valid options
    if (!options.lift && !options.stairs) {
        return {
            error: 'No valid path found via lift or stairs',
            phases: [],
            options: null
        };
    }
    
    // Determine which option to use
    let selectedOption;
    let selectedType;
    
    if (preferredTransition === 'lift' && options.lift) {
        selectedOption = options.lift;
        selectedType = 'lift';
    } else if (preferredTransition === 'stairs' && options.stairs) {
        selectedOption = options.stairs;
        selectedType = 'stairs';
    } else if (options.lift && options.stairs) {
        // Default to shorter distance
        if (options.lift.totalDistance <= options.stairs.totalDistance) {
            selectedOption = options.lift;
            selectedType = 'lift';
        } else {
            selectedOption = options.stairs;
            selectedType = 'stairs';
        }
    } else if (options.lift) {
        selectedOption = options.lift;
        selectedType = 'lift';
    } else {
        selectedOption = options.stairs;
        selectedType = 'stairs';
    }
    
    // Build the complete navigation phases for the selected option
    const phases = [
        {
            phase: 1,
            floor: startFloor,
            type: 'navigation',
            description: `Navigate to ${selectedType === 'lift' ? 'Lift' : 'Stairs'}`,
            path: selectedOption.transitionPath.path,
            distance: selectedOption.transitionPath.distance,
            transitionType: selectedType,
            transitionNodeId: selectedOption.transitionNodeId,
            startNode: startNode,
            endNode: selectedOption.transitionNodeId
        },
        {
            phase: 2,
            floor: null, // Transition phase
            type: 'transition',
            description: `Take the ${selectedType} from Floor ${startFloor === 0 ? 'G' : startFloor} to Floor ${endFloor === 0 ? 'G' : endFloor}`,
            transitionType: selectedType,
            fromFloor: startFloor,
            toFloor: endFloor,
            transitionNodeId: selectedOption.transitionNodeId
        },
        {
            phase: 3,
            floor: endFloor,
            type: 'navigation',
            description: `Navigate to destination`,
            path: selectedOption.destinationPath.path,
            distance: selectedOption.destinationPath.distance,
            startNode: selectedOption.transitionNodeId,
            endNode: endNode
        }
    ];
    
    return {
        success: true,
        phases,
        totalDistance: selectedOption.totalDistance,
        transitionType: selectedType,
        transitionNodeId: selectedOption.transitionNodeId,
        options: options, // Return both options for UI selection
        startFloor,
        endFloor
    };
}
