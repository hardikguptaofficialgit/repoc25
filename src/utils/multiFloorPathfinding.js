import { nodes, poiCategories } from '../data/buildingData';
import { findShortestPath, findNearestPOI } from './pathfinding';

/**
 * Extract floor number from room label (e.g., "A-001" -> 0, "A-311" -> 3)
 */
export function getFloorFromLabel(label) {
  if (!label) return 0;
  
  // Match patterns like A-001, B-311, etc.
  const match = label.match(/^[A-Z]-(\d{3})$/);
  if (match) {
    const roomNum = parseInt(match[1]);
    return Math.floor(roomNum / 100);
  }
  
  return 0; // Default to ground floor
}

/**
 * Get floor number from node ID
 */
export function getNodeFloor(nodeId) {
  const node = nodes[nodeId];
  if (!node) return 0;
  return getFloorFromLabel(node.label);
}

/**
 * Find nearest stairs and lifts on a given floor
 */
export function findFloorTransitions(graph, sourceNodeId, sourceFloor) {
  const stairs = poiCategories.stairs || [];
  const lifts = poiCategories.lifts || [];
  
  // Find nearest stair
  const stairResult = findNearestPOI(graph, sourceNodeId, stairs);
  
  // Find nearest lift
  const liftResult = findNearestPOI(graph, sourceNodeId, lifts);
  
  return {
    stair: stairResult.target ? {
      nodeId: stairResult.target,
      path: stairResult.path,
      distance: stairResult.distance,
      label: nodes[stairResult.target]?.label
    } : null,
    lift: liftResult.target ? {
      nodeId: liftResult.target,
      path: liftResult.path,
      distance: liftResult.distance,
      label: nodes[liftResult.target]?.label
    } : null
  };
}

/**
 * Find the same transition point (stairs/lift) on target floor
 */
export function findCorrespondingTransition(transitionNodeId, targetFloor) {
  const transitionNode = nodes[transitionNodeId];
  if (!transitionNode) return null;
  
  // Stairs and lifts have the same physical location across floors
  // So we return the same node ID (it exists on all floors)
  return transitionNodeId;
}

/**
 * Create multi-floor path with automatic transition selection
 * @param {Object} graph - The navigation graph
 * @param {string} startNodeId - Starting node ID
 * @param {string} endNodeId - Ending node ID
 * @param {string} transitionPreference - 'stairs' or 'lift' (optional)
 * @returns {Object} Multi-floor path information
 */
export function createMultiFloorPath(graph, startNodeId, endNodeId, transitionPreference = null) {
  const startFloor = getNodeFloor(startNodeId);
  const endFloor = getNodeFloor(endNodeId);
  
  // Same floor - use regular pathfinding
  if (startFloor === endFloor) {
    const result = findShortestPath(graph, startNodeId, endNodeId);
    return {
      isSingleFloor: true,
      segments: [{
        floor: startFloor,
        path: result.path,
        distance: result.distance,
        type: 'navigation'
      }],
      totalDistance: result.distance,
      error: result.error
    };
  }
  
  // Multi-floor navigation
  const transitions = findFloorTransitions(graph, startNodeId, startFloor);
  
  if (!transitions.stair && !transitions.lift) {
    return {
      error: 'No stairs or lifts found for floor transition',
      isSingleFloor: false,
      segments: []
    };
  }
  
  // Determine which transition to use
  let selectedTransition;
  let transitionType;
  
  if (transitionPreference === 'stairs' && transitions.stair) {
    selectedTransition = transitions.stair;
    transitionType = 'stairs';
  } else if (transitionPreference === 'lift' && transitions.lift) {
    selectedTransition = transitions.lift;
    transitionType = 'lift';
  } else {
    // Default to nearest (shorter distance)
    if (transitions.stair && transitions.lift) {
      if (transitions.stair.distance <= transitions.lift.distance) {
        selectedTransition = transitions.stair;
        transitionType = 'stairs';
      } else {
        selectedTransition = transitions.lift;
        transitionType = 'lift';
      }
    } else {
      selectedTransition = transitions.stair || transitions.lift;
      transitionType = transitions.stair ? 'stairs' : 'lift';
    }
  }
  
  // Segment 1: Start to transition point on source floor
  const segment1 = {
    floor: startFloor,
    path: selectedTransition.path,
    distance: selectedTransition.distance,
    type: 'to_transition',
    transitionNode: selectedTransition.nodeId,
    transitionType: transitionType,
    transitionLabel: selectedTransition.label
  };
  
  // Segment 2: Transition (floor change)
  const transitionOnTargetFloor = findCorrespondingTransition(selectedTransition.nodeId, endFloor);
  
  const segment2 = {
    floor: startFloor,
    targetFloor: endFloor,
    type: 'transition',
    transitionType: transitionType,
    transitionNode: selectedTransition.nodeId,
    transitionLabel: selectedTransition.label,
    path: [selectedTransition.nodeId] // Just the transition node
  };
  
  // Segment 3: From transition point to destination on target floor
  const segment3Result = findShortestPath(graph, transitionOnTargetFloor, endNodeId);
  const segment3 = {
    floor: endFloor,
    path: segment3Result.path,
    distance: segment3Result.distance,
    type: 'from_transition',
    transitionNode: transitionOnTargetFloor,
    transitionType: transitionType
  };
  
  const totalDistance = segment1.distance + segment3.distance;
  
  return {
    isSingleFloor: false,
    segments: [segment1, segment2, segment3],
    totalDistance: totalDistance,
    startFloor: startFloor,
    endFloor: endFloor,
    transitionType: transitionType,
    transitionLabel: selectedTransition.label,
    availableTransitions: {
      stairs: transitions.stair,
      lift: transitions.lift
    }
  };
}

/**
 * Get current segment and floor based on navigation progress
 * @param {Object} multiFloorPath - Result from createMultiFloorPath
 * @param {number} currentStepIndex - Current step in navigation
 * @returns {Object} Current segment info and floor
 */
export function getCurrentSegmentInfo(multiFloorPath, currentStepIndex) {
  if (multiFloorPath.isSingleFloor) {
    return {
      segmentIndex: 0,
      segment: multiFloorPath.segments[0],
      floor: multiFloorPath.segments[0].floor,
      isTransitioning: false
    };
  }
  
  // Count steps/instructions per segment to determine current segment
  let stepCounter = 0;
  
  for (let i = 0; i < multiFloorPath.segments.length; i++) {
    const segment = multiFloorPath.segments[i];
    
    // Each segment contributes instructions
    let segmentSteps = 1; // At least one instruction
    
    if (segment.type === 'to_transition' || segment.type === 'from_transition') {
      // Navigation segments have multiple steps based on path length
      segmentSteps = Math.max(1, segment.path.length - 1);
    } else if (segment.type === 'transition') {
      // Transition step (take stairs/lift)
      segmentSteps = 1;
    }
    
    if (currentStepIndex < stepCounter + segmentSteps) {
      return {
        segmentIndex: i,
        segment: segment,
        floor: segment.floor !== undefined ? segment.floor : segment.targetFloor,
        isTransitioning: segment.type === 'transition',
        localStepIndex: currentStepIndex - stepCounter
      };
    }
    
    stepCounter += segmentSteps;
  }
  
  // Reached destination
  const lastSegment = multiFloorPath.segments[multiFloorPath.segments.length - 1];
  return {
    segmentIndex: multiFloorPath.segments.length - 1,
    segment: lastSegment,
    floor: lastSegment.floor,
    isTransitioning: false,
    completed: true
  };
}
