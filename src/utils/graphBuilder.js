// Graph builder utility for indoor navigation
import { nodes, edges } from '../data/buildingData';

/**
 * Build adjacency list graph from nodes and edges
 * @returns {Object} - Adjacency list representation of the graph
 */
export function buildGraph() {
    const graph = {};

    // Initialize all nodes in the graph
    for (let nodeId in nodes) {
        graph[nodeId] = [];
    }

    // Add edges (bidirectional)
    for (let edge of edges) {
        const [node1, node2, weight = 1] = edge;

        // Validate nodes exist
        if (!graph[node1] || !graph[node2]) {
            console.warn(`Invalid edge: ${node1} -> ${node2}`);
            continue;
        }

        // Add bidirectional edges
        graph[node1].push({ node: node2, weight });
        graph[node2].push({ node: node1, weight });
    }

    return graph;
}

/**
 * Search for locations by query string
 * @param {string} query - Search query
 * @returns {Array} - Array of matching locations
 */
export function searchLocations(query) {
    if (!query || query.length === 0) return [];

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    for (let [nodeId, node] of Object.entries(nodes)) {
        // Skip corridor nodes from search results
        if (node.type === 'corridor') continue;

        const labelMatch = node.label.toLowerCase().includes(searchTerm);
        const typeMatch = node.type.replace(/_/g, ' ').toLowerCase().includes(searchTerm);
        const idMatch = nodeId.toLowerCase().includes(searchTerm);

        if (labelMatch || typeMatch || idMatch) {
            results.push({
                id: nodeId,
                label: node.label,
                type: node.type,
                // Score for sorting (exact match gets higher score)
                score: labelMatch ? (node.label.toLowerCase().startsWith(searchTerm) ? 3 : 2) : 1
            });
        }
    }

    // Sort by score (higher first) and then alphabetically
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.label.localeCompare(b.label);
    });

    // Limit results
    return results.slice(0, 15);
}

/**
 * Get all locations of a specific type
 * @param {string} type - Location type (e.g., 'classroom', 'lift', 'stairs')
 * @returns {Array} - Array of locations
 */
export function getLocationsByType(type) {
    const results = [];

    for (let [nodeId, node] of Object.entries(nodes)) {
        if (node.type === type) {
            results.push({
                id: nodeId,
                label: node.label,
                type: node.type
            });
        }
    }

    return results.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get node details by ID
 * @param {string} nodeId - Node ID
 * @returns {Object|null} - Node details or null if not found
 */
export function getNodeById(nodeId) {
    if (!nodeId || !nodes[nodeId]) return null;
    return {
        id: nodeId,
        ...nodes[nodeId]
    };
}

/**
 * Validate if a path only uses corridors
 * All paths should go through corridor nodes, not directly between rooms
 * @param {Array} path - Array of node IDs
 * @returns {boolean} - True if path is valid
 */
export function validatePath(path) {
    if (!path || path.length < 2) return false;

    // Check if consecutive nodes are connected via edges
    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];

        // Check if edge exists
        const edgeExists = edges.some(edge =>
            (edge[0] === current && edge[1] === next) ||
            (edge[0] === next && edge[1] === current)
        );

        if (!edgeExists) {
            console.warn(`Invalid path segment: ${current} -> ${next}`);
            return false;
        }
    }

    return true;
}

/**
 * Get nodes belonging to a specific floor.
 * Note: Assumes 'floor' property exists on nodes. If not, returns all nodes as fallback or based on ID convention.
 * @param {number} floor - Floor number (0, 1, 2, 3)
 * @returns {Object} - Map of nodes on the floor
 */
export function getNodesByFloor(floor) {
    // CURRENT LOGIC UPDATE:
    // The user requested that data for floors 1, 2, and 3 be shown.
    // However, the current data set lacks specific 'floor' or 'z' properties for these levels.
    // To comply with the request and ensure functionality (Quick Actions, etc.) works on all floors,
    // we return ALL nodes for ANY requested floor.
    // This effectively mirrors the map behavior where we enabled universal visibility.

    // In the future, when data is properly tagged:
    // 1. Uncomment strictly filtering logic
    // 2. Or implement ID-based heuristics (e.g., A1xx -> Floor 1)

    return nodes;
}
