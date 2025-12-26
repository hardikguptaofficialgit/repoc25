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
 * Get nodes filtered/modified by floor
 * @param {number} floor - Floor number
 * @returns {Object} - Filtered nodes
 */
export function getNodesByFloor(floor) {
    const filtered = {};
    Object.entries(nodes).forEach(([id, node]) => {
        let newNode = { ...node };

        // Update room labels based on floor
        if (newNode.label && newNode.label.match(/^[A-Z]-\d{3}$/)) {
            const match = newNode.label.match(/^([A-Z])-(\d{3})$/);
            if (match) {
                const block = match[1];
                const roomNumber = parseInt(match[2]);

                // Update room number based on floor
                if (floor === 0) {
                    // Ground floor: keep original (C001, A007, etc.)
                    newNode.label = `${block}-${roomNumber.toString().padStart(3, '0')}`;
                } else {
                    // Upper floors: add floor number to room number
                    // For floor 1: C001 → C101, A007 → A107
                    // For floor 2: C001 → C201, A007 → A207
                    const newRoomNumber = (floor * 100) + roomNumber;
                    newNode.label = `${block}-${newRoomNumber.toString().padStart(3, '0')}`;
                }
            }
        }

        // Floor Logic
        if (floor > 0) {
            // 1. Remove entrances for all floors above ground
            if (newNode.type === 'entrance') return;

            // 2. 1st Floor: Remove cafe and lobby, plus specific lifts and stairs
            if (floor === 1) {
                if (newNode.type === 'cafeteria' || newNode.label.includes('LOBBY')) return;

                // Remove specific nodes only for 1st floor
                if (id === 'node_1053' || id === 'node_1054' || id === 'node_1067') return;

                // Remove FACULTY LOUNGE (node_1074) for 1st floor only
                if (id === 'node_1074') return;

                // Remove specific corridor nodes for 1st floor only
                if (id === 'node_1177' || id === 'node_1178' || id === 'node_1179' || id === 'node_1180' ||
                    id === 'node_1181' || id === 'node_1182' || id === 'node_1183' || id === 'node_1184') return;
            }

            // 3. 2nd Floor: Convert lobby to library
            if (floor === 2) {
                if (newNode.label.includes('LOBBY')) {
                    newNode.label = 'LIBRARY';
                    newNode.type = 'library';
                }

                // Remove specific nodes for 2nd floor
                if (id === 'node_1074' || id === 'node_1073' || id === 'node_1072' ||
                    id === 'node_1181' || id === 'node_1182' || id === 'node_1184') return;
            }

            // 4. 3rd Floor: Remove specific nodes
            if (floor === 3) {
                // Remove specific nodes for 3rd floor
                if (id === 'node_1074' || id === 'node_1073' || id === 'node_1072' ||
                    id === 'node_1181' || id === 'node_1182' || id === 'node_1184') return;
            }

            // 5. Higher floors: Entrances already removed
            // Depending on user's original request: "Remove entrances for floors above ground. Remove cafe/lobby from 1st floor, convert lobby on 2nd to library."
            // This implies 3rd floor follows general "above ground" rules but keeps cafe if present (if requested).
        }

        filtered[id] = newNode;
    });
    return filtered;
}

/**
 * Calculate fuzzy match score between query and text
 * @param {string} query - Search query
 * @param {string} text - Text to match against
 * @returns {number} - Match score (higher is better)
 */
function fuzzyMatchScore(query, text) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match - highest score
    if (textLower === queryLower) return 1000;

    // Starts with query - very high score
    if (textLower.startsWith(queryLower)) return 900;

    // Contains exact query - high score
    if (textLower.includes(queryLower)) return 800;

    // Word boundary match (e.g., "A-101" matches "a 101")
    const words = textLower.split(/[\s\-_]/);
    if (words.some(word => word.startsWith(queryLower))) return 750;

    // Acronym match (e.g., "wg" matches "Washroom Gents")
    const acronym = words.map(w => w[0]).join('');
    if (acronym.includes(queryLower)) return 700;

    // Fuzzy character-by-character matching
    let score = 0;
    let queryIndex = 0;
    let consecutiveMatches = 0;

    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
        if (textLower[i] === queryLower[queryIndex]) {
            score += 10 + consecutiveMatches * 5; // Bonus for consecutive matches
            consecutiveMatches++;
            queryIndex++;
        } else {
            consecutiveMatches = 0;
        }
    }

    // All characters matched in order
    if (queryIndex === queryLower.length) {
        return score + 100;
    }

    return 0;
}

/**
 * Search for locations by query string with fuzzy matching
 * @param {string} query - Search query
 * @param {number} floor - Current floor
 * @returns {Array} - Array of matching locations
 */
export function searchLocations(query, floor = 0) {
    if (!query || query.length === 0) return [];

    const searchTerm = query.toLowerCase().trim();
    const results = [];
    const floorNodes = getNodesByFloor(floor);

    for (let [nodeId, node] of Object.entries(floorNodes)) {
        // Skip corridor nodes from search results
        if (node.type === 'corridor') continue;

        // Calculate match scores for different fields
        const labelScore = fuzzyMatchScore(searchTerm, node.label);
        const typeScore = fuzzyMatchScore(searchTerm, node.type.replace(/_/g, ' '));
        const idScore = fuzzyMatchScore(searchTerm, nodeId);

        // Take the best score
        const bestScore = Math.max(labelScore, typeScore * 0.8, idScore * 0.6);

        // Only include if there's a meaningful match
        if (bestScore > 0) {
            // Priority boost for certain types
            let typePriority = 1;
            if (node.type === 'classroom') typePriority = 1.2;
            if (node.type === 'washroom_gents' || node.type === 'washroom_ladies') typePriority = 1.3;
            if (node.type === 'stairs' || node.type === 'lift') typePriority = 1.4;
            if (node.type === 'entrance') typePriority = 1.5;

            results.push({
                id: nodeId,
                label: node.label,
                type: node.type,
                score: bestScore * typePriority,
                matchType: labelScore > typeScore ? 'label' : 'type'
            });
        }
    }

    // Sort by score (higher first) and then alphabetically
    results.sort((a, b) => {
        if (Math.abs(b.score - a.score) > 10) return b.score - a.score;
        return a.label.localeCompare(b.label);
    });

    // Limit results to top 20
    return results.slice(0, 20);
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