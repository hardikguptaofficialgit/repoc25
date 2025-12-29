import React, { useState, useEffect } from 'react';
import FloorMap from './components/Map/FloorMap';
import SearchBar from './components/Navigation/SearchBar';
import RouteInfo from './components/Navigation/RouteInfo';
import QuickActions from './components/Navigation/QuickActions';
import NavigationOverlay from './components/Navigation/NavigationOverlay';
import InstallPrompt from './components/UI/InstallPrompt';
import { buildGraph, getNodesByFloor } from './utils/graphBuilder';
import { findShortestPath, findNearestPOI, calculateCrossFloorRoute } from './utils/pathfinding';
import { nodes, poiCategories } from './data/buildingData';
import { ArrowUpDown, Trash2, Edit3, Eye, Menu, ChevronLeft, Building, ChevronDown, LogOut } from 'lucide-react';
import './App.css';

function App({ isAdmin, setIsAdmin }) {
  const [graph, setGraph] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [path, setPath] = useState([]);
  const [distance, setDistance] = useState(0);
  const [error, setError] = useState('');

  const [editorMode, setEditorMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);

  // Cross-floor navigation state
  const [crossFloorNavigation, setCrossFloorNavigation] = useState(null);
  const [navigationPhase, setNavigationPhase] = useState(0); // 0: not started, 1: to lift/stairs, 2: transition, 3: to destination
  const [startFloor, setStartFloor] = useState(null);
  const [endFloor, setEndFloor] = useState(null);

  // Check for existing admin session
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession === 'true' && !isAdmin) {
      setIsAdmin(true);
    }
  }, [isAdmin, setIsAdmin]);

  useEffect(() => {
    const builtGraph = buildGraph();
    setGraph(builtGraph);
  }, []);

  useEffect(() => {
    if (selectedStart && selectedEnd && graph) {
      calculateRoute(selectedStart.id, selectedEnd.id);
    }
  }, [selectedStart, selectedEnd, graph]);

  const toggleEditorMode = () => {
    const newEditorState = !editorMode;
    setEditorMode(newEditorState);
    setSidebarOpen(!newEditorState);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setEditorMode(false);
    localStorage.removeItem('adminSession');
  };

  const calculateRoute = (startId, endId) => {
    if (!graph) return;
    
    // Check if start and end are on the same floor
    const startFloorNum = selectedStart?.floor ?? currentFloor;
    const endFloorNum = selectedEnd?.floor ?? currentFloor;
    
    // If same floor, use normal routing
    if (startFloorNum === endFloorNum) {
      const result = findShortestPath(graph, startId, endId);
      if (result.error) {
        setError(result.error);
        setPath([]);
        setDistance(0);
      } else {
        setPath(result.path);
        setDistance(result.distance);
        setError('');
      }
      // Clear cross-floor navigation
      setCrossFloorNavigation(null);
      setNavigationPhase(0);
      setStartFloor(null);
      setEndFloor(null);
    } else {
      // Cross-floor navigation
      const startFloorNodes = getNodesByFloor(startFloorNum);
      const endFloorNodes = getNodesByFloor(endFloorNum);
      
      const crossFloorResult = calculateCrossFloorRoute(
        graph,
        startId,
        endId,
        nodes,
        startFloorNodes,
        endFloorNodes,
        startFloorNum,
        endFloorNum
      );
      
      if (crossFloorResult.error) {
        setError(crossFloorResult.error);
        setPath([]);
        setDistance(0);
        setCrossFloorNavigation(null);
      } else {
        // Store the cross-floor navigation data - start at phase 0 (selection)
        setCrossFloorNavigation(crossFloorResult);
        setNavigationPhase(0); // Phase 0 = selection phase
        setStartFloor(startFloorNum);
        setEndFloor(endFloorNum);
        
        // Don't set path yet - wait for user to select lift or stairs
        setPath([]);
        setDistance(crossFloorResult.totalDistance);
        setError('');
      }
    }
  };

  // Handle selecting a transition type (lift or stairs)
  const handleSelectTransition = (transitionType) => {
    if (!crossFloorNavigation || !selectedStart || !selectedEnd) return;
    
    // Use floor info from crossFloorNavigation (more reliable than state)
    const srcFloor = crossFloorNavigation.startFloor ?? startFloor;
    const dstFloor = crossFloorNavigation.endFloor ?? endFloor;
    
    const startFloorNodes = getNodesByFloor(srcFloor);
    const endFloorNodes = getNodesByFloor(dstFloor);
    
    // Recalculate route with the selected transition type
    const crossFloorResult = calculateCrossFloorRoute(
      graph,
      selectedStart.id,
      selectedEnd.id,
      nodes,
      startFloorNodes,
      endFloorNodes,
      srcFloor,
      dstFloor,
      transitionType // Pass the preferred transition type
    );
    
    if (crossFloorResult.error) {
      setError(crossFloorResult.error);
      return;
    }
    
    setCrossFloorNavigation(crossFloorResult);
    setNavigationPhase(1); // Move to phase 1 (navigation to lift/stairs)
    setPath(crossFloorResult.phases[0].path);
    setDistance(crossFloorResult.totalDistance);
    
    // Ensure floor states are set
    setStartFloor(srcFloor);
    setEndFloor(dstFloor);
  };

  // Handle navigation phase transitions
  const handleNextPhase = () => {
    if (!crossFloorNavigation) return;
    
    const nextPhase = navigationPhase + 1;
    
    if (nextPhase === 2) {
      // Transition phase - show message to take lift/stairs
      setNavigationPhase(2);
      // Keep the phase 1 path visible on the map so user can see the route to lift/stairs
      // The path is already set from phase 1, so we don't clear it
    } else if (nextPhase === 3) {
      // Phase 3 - navigate to destination on target floor
      setNavigationPhase(3);
      // Use floor info from crossFloorNavigation (more reliable)
      const targetFloor = crossFloorNavigation.endFloor ?? endFloor;
      setCurrentFloor(targetFloor); // Automatically switch to destination floor
      
      // Get the path for phase 3 (index 2 in the phases array)
      const phase3Path = crossFloorNavigation.phases[2]?.path || [];
      console.log('Phase 3 path:', phase3Path, 'Target floor:', targetFloor);
      setPath(phase3Path);
    } else if (nextPhase > 3) {
      // Navigation complete
      setNavigationPhase(0);
      setCrossFloorNavigation(null);
    }
  };

  const handlePrevPhase = () => {
    if (!crossFloorNavigation || navigationPhase <= 1) return;
    
    const prevPhase = navigationPhase - 1;
    
    if (prevPhase === 1) {
      setNavigationPhase(1);
      // Use floor info from crossFloorNavigation (more reliable)
      const srcFloor = crossFloorNavigation.startFloor ?? startFloor;
      setCurrentFloor(srcFloor);
      setPath(crossFloorNavigation.phases[0].path);
    } else if (prevPhase === 2) {
      setNavigationPhase(2);
      setPath([]);
    }
  };

  const handleStartSelect = (location) => {
    // Store the floor with the location - use location.floor if available (from search), otherwise use currentFloor
    const locationFloor = location.floor !== undefined ? location.floor : currentFloor;
    setSelectedStart({ ...location, floor: locationFloor });
    setStartLocation(location.label);
    setStartFloor(locationFloor);
    // Switch to the start location's floor so user can see it on the map
    if (locationFloor !== currentFloor) {
      setCurrentFloor(locationFloor);
    }
    setError('');
  };

  const handleEndSelect = (location) => {
    // Store the floor with the location - use location.floor if available (from search), otherwise use currentFloor
    const locationFloor = location.floor !== undefined ? location.floor : currentFloor;
    setSelectedEnd({ ...location, floor: locationFloor });
    setEndLocation(location.label);
    setEndFloor(locationFloor);
    setError('');
  };

  const handleQuickAction = (poiType) => {
    if (!graph) {
      setError('Map not loaded yet');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Determine the current user position
    // If in cross-floor navigation phase 3, use the transition node (lift/stairs) on current floor
    // Otherwise, use the selected start location
    let currentPositionId = null;
    let currentPositionLabel = '';

    if (crossFloorNavigation && navigationPhase === 3) {
      // User is on the destination floor after taking lift/stairs
      currentPositionId = crossFloorNavigation.transitionNodeId;
      currentPositionLabel = nodes[currentPositionId]?.label || 'Current Location';
    } else if (selectedStart) {
      currentPositionId = selectedStart.id;
      currentPositionLabel = selectedStart.label;
    } else {
      setError('Please select a starting location first');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const floorNodes = getNodesByFloor(currentFloor);
    let targetNodes = [];
    switch (poiType) {
      case 'stairs': targetNodes = poiCategories.stairs; break;
      case 'lift': targetNodes = poiCategories.lifts; break;
      case 'washroom_gents': targetNodes = poiCategories.washrooms_gents; break;
      case 'washroom_ladies': targetNodes = poiCategories.washrooms_ladies; break;
      case 'entrance': targetNodes = poiCategories.entrances; break;
      case 'water_cooler': targetNodes = poiCategories.water_coolers; break;
      default: return;
    }

    // Filter targetNodes based on whether they exist on the current floor
    const availableTargets = (targetNodes || []).filter(id => floorNodes[id]);

    const result = findNearestPOI(graph, currentPositionId, availableTargets);
    if (result.error || !result.target) {
      setError(result.error || `No ${poiType.replace(/_/g, ' ')} found on ${currentFloor === 0 ? 'Ground' : currentFloor + 'F'}`);
      setTimeout(() => setError(''), 3000);
      setPath([]);
      setDistance(0);
      return;
    }

    if (result.target) {
      const targetNode = nodes[result.target];
      
      // Update start location to current position if we were in cross-floor navigation
      if (crossFloorNavigation && navigationPhase === 3) {
        setSelectedStart({
          id: currentPositionId,
          label: currentPositionLabel,
          type: nodes[currentPositionId]?.type || 'lift',
          floor: currentFloor
        });
        setStartLocation(currentPositionLabel);
        setStartFloor(currentFloor);
      }
      
      setSelectedEnd({
        id: result.target,
        label: targetNode.label,
        type: targetNode.type,
        floor: currentFloor // Quick action targets are on current floor
      });
      setEndLocation(targetNode.label);
      setPath(result.path);
      setDistance(result.distance);
      setError('');
      // Clear cross-floor navigation for same-floor quick actions
      setCrossFloorNavigation(null);
      setNavigationPhase(0);
    }
  };

  const handleSwapLocations = () => {
    const tempStart = selectedStart;
    const tempStartLocation = startLocation;
    const tempStartFloor = startFloor;
    setSelectedStart(selectedEnd);
    setStartLocation(endLocation);
    setStartFloor(endFloor);
    setSelectedEnd(tempStart);
    setEndLocation(tempStartLocation);
    setEndFloor(tempStartFloor);
  };

  const handleClearRoute = () => {
    setStartLocation('');
    setEndLocation('');
    setSelectedStart(null);
    setSelectedEnd(null);
    setPath([]);
    setDistance(0);
    setError('');
    // Clear cross-floor navigation state
    setCrossFloorNavigation(null);
    setNavigationPhase(0);
    setStartFloor(null);
    setEndFloor(null);
  };

  const handleMapNodeClick = (nodeId, node) => {
    if (editorMode) return;
    if (node.type === 'corridor') return;

    setSidebarOpen(true);

    // Include the current floor when clicking on a node from the map
    const location = { id: nodeId, label: node.label, type: node.type, floor: currentFloor };

    if (!selectedStart) {
      handleStartSelect(location);
      return;
    }
    if (selectedStart.id === nodeId && selectedStart.floor === currentFloor) {
      setError('Start and destination cannot be the same location');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!selectedEnd || selectedEnd.id !== nodeId) {
      handleEndSelect(location);
      return;
    }
    if (selectedEnd.id === nodeId) {
      setSelectedEnd(null);
      setEndLocation('');
      setPath([]);
      setDistance(0);
      setError('');
      // Clear cross-floor navigation
      setCrossFloorNavigation(null);
      setNavigationPhase(0);
    }
  };

  return (
    <div className="app">

      {/* --- Top Search Bar (Mobile-First) --- */}
      <div className="top-search-bar">
        <div className="top-search-card">
          <div className="search-compact-group">
            <div className="search-row">
              <SearchBar
                value={startLocation}
                onChange={setStartLocation}
                onSelect={handleStartSelect}
                placeholder="From..."
                floor={currentFloor}
                searchAllFloors={true}
              />
            </div>
            <div className="search-row">
              <SearchBar
                value={endLocation}
                onChange={setEndLocation}
                onSelect={handleEndSelect}
                placeholder="To..."
                floor={currentFloor}
                searchAllFloors={true}
              />
              <button
                className="swap-btn-compact"
                onClick={handleSwapLocations}
                disabled={!selectedStart || !selectedEnd}
                title="Swap locations"
              >
                <ArrowUpDown size={18} />
              </button>
            </div>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span> {error}
              </div>
            )}
            {(selectedStart || selectedEnd) && (
              <button className="clear-route-btn-mobile" onClick={handleClearRoute}>
                <Trash2 size={14} /> Clear Route
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- 1. Independent Floating Toggle Button --- */}
      {/* detached from the sidebar structure */}
      <div className={`floating-menu-trigger ${!sidebarOpen && !editorMode ? 'visible' : ''}`}>
        <button
          className="glass-btn"
          onClick={() => setSidebarOpen(true)}
          title="Open Navigation"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* --- 2. Detached Sidebar Wrapper --- */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'} ${sidebarMinimized ? 'minimized' : ''}`}>
        <div className="sheet-handle" onClick={() => {
          if (sidebarMinimized) {
            setSidebarMinimized(false);
          } else {
            setSidebarOpen(!sidebarOpen);
          }
        }}></div>

        {/* Container 1: Header & Search (Top Island) */}
        <div className="panel-card header-island">

          <div className="sidebar-header">
            <div className="brand">
              <h1>KIIT Campus 25</h1>
            </div>
            <button className="close-btn-mini" onClick={() => setSidebarOpen(false)}>
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="search-section">
            <div className="search-group">
              <label className="search-label">
                <div className="dot start-dot"></div> Start
              </label>
              <SearchBar
                value={startLocation}
                onChange={setStartLocation}
                onSelect={handleStartSelect}
                placeholder="Starting point..."
                floor={currentFloor}
                searchAllFloors={true}
              />
            </div>

            <div className="connector-gap">
              <button
                className="swap-button-floating"
                onClick={handleSwapLocations}
                disabled={!selectedStart || !selectedEnd}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>

            <div className="search-group">
              <label className="search-label">
                <div className="dot end-dot"></div> End
              </label>
              <SearchBar
                value={endLocation}
                onChange={setEndLocation}
                onSelect={handleEndSelect}
                placeholder="Destination..."
                floor={currentFloor}
                searchAllFloors={true}
              />
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span> {error}
              </div>
            )}

            {(selectedStart || selectedEnd) && (
              <button className="clear-route-link" onClick={handleClearRoute}>
                Clear Route
              </button>
            )}
          </div>
        </div>

        {/* Container 2: Actions & Results (Bottom Island) */}
        {/* Only show this container if there's content to show, or always show QuickActions */}
        <div className="panel-card action-island">
          {/* Cross-floor navigation indicator - only show for phase 0 (selection) */}
          {crossFloorNavigation && navigationPhase === 0 && (
            <div className="cross-floor-indicator">
              <div className="cross-floor-header">
                <span className="cross-floor-info">
                  Floor {startFloor === 0 ? 'G' : startFloor} → Floor {endFloor === 0 ? 'G' : endFloor}
                </span>
              </div>

              {/* Phase 0: Selection of lift or stairs */}
              {crossFloorNavigation.options && (
                <div className="transition-selection">
                  {/* <p className="selection-title">Multi-Floor Navigation</p> */}
                  <div className="transition-options">
                    {crossFloorNavigation.options.lift && (
                      <button 
                        className="transition-option lift-option"
                        onClick={() => handleSelectTransition('lift')}
                      >
                        <span className="option-label">Lift</span>
                        <span className="option-distance">
                          ~{Math.round(crossFloorNavigation.options.lift.totalDistance * 0.2)} steps
                        </span>
                      </button>
                    )}
                    {crossFloorNavigation.options.lift && crossFloorNavigation.options.stairs && (
                      <span className="transition-or">OR</span>
                    )}
                    {crossFloorNavigation.options.stairs && (
                      <button 
                        className="transition-option stairs-option"
                        onClick={() => handleSelectTransition('stairs')}
                      >
                        <span className="option-label">Stairs</span>
                        <span className="option-distance">
                          ~{Math.round(crossFloorNavigation.options.stairs.totalDistance * 0.2)} steps
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Instructions - handles both single-floor and multi-floor navigation */}
          {(path.length > 0 || (crossFloorNavigation && navigationPhase === 2)) && (
            <div className="navigation-integrated">
              <NavigationOverlay 
                path={path} 
                isMinimized={sidebarMinimized}
                onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
                crossFloorPhase={navigationPhase}
                crossFloorNavigation={crossFloorNavigation}
                currentFloor={currentFloor}
                onNextPhase={handleNextPhase}
                onPrevPhase={handlePrevPhase}
                startFloor={startFloor}
                endFloor={endFloor}
              />
            </div>
          )}

          {/* Show QuickActions always when minimized, or full content when expanded */}
          {sidebarMinimized ? (
            <QuickActions
              onQuickAction={handleQuickAction}
              currentLocation={selectedStart}
              minimized={false}
              crossFloorPhase={navigationPhase}
              isOnNewFloor={crossFloorNavigation !== null}
            />
          ) : (
            <>
              <QuickActions
                onQuickAction={handleQuickAction}
                currentLocation={selectedStart}
                minimized={path.length > 0}
                crossFloorPhase={navigationPhase}
                isOnNewFloor={crossFloorNavigation !== null}
              />

              {path.length > 0 && (
                <>
                  <div className="divider"></div>
                  <RouteInfo
                    path={path}
                    distance={distance}
                    startLabel={startLocation}
                    endLabel={endLocation}
                  />
                </>
              )}
            </>
          )}
        </div>

      </div>

      {/* --- Map Tool Layer (Top Right) --- */}
      <div className="map-tool-layer">
        {isAdmin && (
          <>
            <button
              className={`glass-btn editor-toggle ${editorMode ? 'active' : ''}`}
              onClick={toggleEditorMode}
              title={editorMode ? 'Exit Editor Mode' : 'Enter Editor Mode'}
            >
              {editorMode ? <Eye size={20} /> : <Edit3 size={20} />}
            </button>
            <button
              className="glass-btn logout-btn"
              onClick={handleLogout}
              title="Logout Admin"
            >
              <LogOut size={18} />
            </button>
          </>
        )}

        {/* Floor Dropdown */}
        <div className="floor-dropdown-container">
          <button
            className="floor-dropdown-trigger glass-btn"
            onClick={() => setShowFloorDropdown(!showFloorDropdown)}
          >
            <Building size={18} />
            <span className="floor-label">{currentFloor === 0 ? 'GF' : `${currentFloor}F`}</span>
            <ChevronDown size={14} className={showFloorDropdown ? 'rotate-180' : ''} />
          </button>

          {showFloorDropdown && (
            <div className="floor-options-panel glass-panel">
              {[3, 2, 1, 0].map((floor) => (
                <button
                  key={floor}
                  className={`floor-option ${currentFloor === floor ? 'selected' : ''}`}
                  onClick={() => {
                    setCurrentFloor(floor);
                    setShowFloorDropdown(false);
                  }}
                >
                  <span className="floor-num">{floor === 0 ? 'G' : `${floor}F`}</span>
                  <span className="floor-name">
                    {floor === 0 ? 'Ground Floor' : `${floor}${floor === 1 ? 'st' : floor === 2 ? 'nd' : 'rd'} Floor`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="map-fullscreen">
        <FloorMap
          path={path}
          highlightedNodes={[selectedStart?.id, selectedEnd?.id].filter(Boolean)}
          onNodeClick={handleMapNodeClick}
          selectedStart={selectedStart}
          selectedEnd={selectedEnd}
          editorMode={editorMode}
          currentFloor={currentFloor}
          centerOnPath={path.length > 0}
        />
      </div>

      <InstallPrompt />
    </div>
  );
}

export default App;