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
