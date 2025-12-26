import { nodes, edges } from '../data/buildingData';

/**
 * Build adjacency list graph from nodes and edges
 */
export function buildGraph() {
    const graph = {};

    for (let nodeId in nodes) {
        graph[nodeId] = [];
    }

    for (let edge of edges) {
        const [node1, node2, weight = 1] = edge;

        if (!graph[node1] || !graph[node2]) {
            console.warn(`Invalid edge: ${node1} -> ${node2}`);
            continue;
        }

        graph[node1].push({ node: node2, weight });
        graph[node2].push({ node: node1, weight });
    }

    return graph;
}

/**
 * Get nodes filtered/modified by floor
 */
export function getNodesByFloor(floor) {
    const filtered = {};
    Object.entries(nodes).forEach(([id, node]) => {
        let newNode = { ...node };

        // Update room labels based on floor (e.g., C001 -> C101 on 1st floor)
        if (newNode.label && newNode.label.match(/^[A-Z]-\d{3}$/)) {
            const match = newNode.label.match(/^([A-Z])-(\d{3})$/);
            if (match) {
                const block = match[1];
                const roomNumber = parseInt(match[2]);

                if (floor === 0) {
                    newNode.label = `${block}-${roomNumber.toString().padStart(3, '0')}`;
                } else {
                    const newRoomNumber = (floor * 100) + roomNumber;
                    newNode.label = `${block}-${newRoomNumber.toString().padStart(3, '0')}`;
                }
            }
        }

        // Ground Floor: Change node_1075 to LOBBY
        if (floor === 0) {
            if (id === 'node_1075') {
                newNode.label = 'LOBBY';
                newNode.type = 'seating';
            }
        }

        // Floor-specific node filtering
        if (floor > 0) {
            if (newNode.type === 'entrance') return;

            // 1st Floor
            if (floor === 1) {
                if (newNode.type === 'cafeteria' || newNode.label.includes('LOBBY')) return;
                if (id === 'node_1053' || id === 'node_1054' || id === 'node_1067') return;
                if (id === 'node_1074') return;
                if (id === 'node_1075') return;
                if (id === 'node_1177' || id === 'node_1178' || id === 'node_1179' || id === 'node_1180' ||
                    id === 'node_1181' || id === 'node_1182' || id === 'node_1183' || id === 'node_1184') return;
            }

            // 2nd Floor
            if (floor === 2) {
                if (id === 'node_1075') {
                    newNode.label = 'LIBRARY';
                    newNode.type = 'library';
                }
                if (id === 'node_1074' || id === 'node_1073' || id === 'node_1072' ||
                    id === 'node_1181' || id === 'node_1182' || id === 'node_1184') return;
            }

            // 3rd Floor
            if (floor === 3) {
                if (id === 'node_1074' || id === 'node_1073' || id === 'node_1072' ||
                    id === 'node_1181' || id === 'node_1182' || id === 'node_1184') return;
            }
        }

        filtered[id] = newNode;
    });
    return filtered;
}

function fuzzyMatchScore(query, text) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    if (textLower === queryLower) return 1000;
    if (textLower.startsWith(queryLower)) return 900;
    if (textLower.includes(queryLower)) return 800;

    const words = textLower.split(/[\s\-_]/);
    if (words.some(word => word.startsWith(queryLower))) return 750;

    const acronym = words.map(w => w[0]).join('');
    if (acronym.includes(queryLower)) return 700;

    let score = 0;
    let queryIndex = 0;
    let consecutiveMatches = 0;

    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
        if (textLower[i] === queryLower[queryIndex]) {
            score += 10 + consecutiveMatches * 5;
            consecutiveMatches++;
            queryIndex++;
        } else {
            consecutiveMatches = 0;
        }
    }

    if (queryIndex === queryLower.length) {
        return score + 100;
    }

    return 0;
}

/**
 * Search for locations by query string with fuzzy matching
 */
export function searchLocations(query, floor = 0) {
    if (!query || query.length === 0) return [];

    const searchTerm = query.toLowerCase().trim();
    const results = [];
    const floorNodes = getNodesByFloor(floor);

    for (let [nodeId, node] of Object.entries(floorNodes)) {
        if (node.type === 'corridor') continue;

        const labelScore = fuzzyMatchScore(searchTerm, node.label);
        const typeScore = fuzzyMatchScore(searchTerm, node.type.replace(/_/g, ' '));
        const idScore = fuzzyMatchScore(searchTerm, nodeId);

        const bestScore = Math.max(labelScore, typeScore * 0.8, idScore * 0.6);

        if (bestScore > 0) {
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

    results.sort((a, b) => {
        if (Math.abs(b.score - a.score) > 10) return b.score - a.score;
        return a.label.localeCompare(b.label);
    });

    return results.slice(0, 20);
}

/**
 * Get all locations of a specific type
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
 */
export function getNodeById(nodeId) {
    if (!nodeId || !nodes[nodeId]) return null;
    return {
        id: nodeId,
        ...nodes[nodeId]
    };
}

/**
 * Validate if a path is valid
 */
export function validatePath(path) {
    if (!path || path.length < 2) return false;

    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];

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