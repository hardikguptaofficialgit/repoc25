import React, { useState, useEffect } from 'react';
import FloorMap from './components/Map/FloorMap';
import SearchBar from './components/Navigation/SearchBar';
import RouteInfo from './components/Navigation/RouteInfo';
import QuickActions from './components/Navigation/QuickActions';
import NavigationOverlay from './components/Navigation/NavigationOverlay';
import { buildGraph } from './utils/graphBuilder';
import { findShortestPath, findNearestPOI } from './utils/pathfinding';
import { generateRouteInstructions } from './utils/navigation';
import { nodes, poiCategories } from './data/buildingData';
import { ArrowUpDown, Edit3, Eye, Menu, ChevronLeft, MapPin } from 'lucide-react';
import './App.css';

function App() {
  const [graph, setGraph] = useState(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [path, setPath] = useState([]);
  const [distance, setDistance] = useState(0);
  const [instructions, setInstructions] = useState([]);
  const [error, setError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  const [editorMode, setEditorMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  // Initial Graph Build
  useEffect(() => {
    const builtGraph = buildGraph();
    setGraph(builtGraph);
  }, []);

  // Update body class for high contrast
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Recalculate route when start/end changes
  useEffect(() => {
    if (selectedStart && selectedEnd && graph) {
      calculateRoute(selectedStart.id, selectedEnd.id);
    }
  }, [selectedStart, selectedEnd, graph]);

  const toggleEditorMode = () => {
    const newEditorState = !editorMode;
    setEditorMode(newEditorState);
    if (newEditorState) {
      setSidebarOpen(false);
    }
  };

  const calculateRoute = (startId, endId) => {
    if (!graph) return;
    const result = findShortestPath(graph, startId, endId);
    if (result.error) {
      setError(result.error);
      setPath([]);
      setDistance(0);
      setInstructions([]);
    } else {
      setPath(result.path);
      setDistance(result.distance);
      setError('');

      const newInstructions = generateRouteInstructions(result.path, nodes);
      setInstructions(newInstructions);

      // Show preview first, don't auto-collapse sidebar yet
      setIsNavigating(false);
      setSidebarOpen(true);
    }
  };

  const handleStartSelect = (location) => {
    setSelectedStart(location);
    setStartLocation(location.label);
    setError('');
  };

  const handleEndSelect = (location) => {
    setSelectedEnd(location);
    setEndLocation(location.label);
    setError('');
  };

  const handleQuickAction = (poiType) => {
    if (!selectedStart || !graph) {
      setError('Please select a starting location first');
      setTimeout(() => setError(''), 3000);
      return;
    }

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

    const result = findNearestPOI(graph, selectedStart.id, targetNodes);
    if (result.error || !result.target) {
      setError(result.error || 'No nearby location found');
      setTimeout(() => setError(''), 3000);
      setPath([]);
      setDistance(0);
      return;
    }

    if (result.target) {
      const targetNode = nodes[result.target];
      setSelectedEnd({
        id: result.target,
        label: targetNode.label,
        type: targetNode.type,
      });
      setEndLocation(targetNode.label);
      setPath(result.path);
      setDistance(result.distance);
      setError('');

      const newInstructions = generateRouteInstructions(result.path, nodes);
      setInstructions(newInstructions);

      if (window.innerWidth <= 1024) {
        setSidebarOpen(false); // Peek mode
      }
    }
  };

  const handleSwapLocations = () => {
    const tempStart = selectedStart;
    const tempStartLocation = startLocation;
    setSelectedStart(selectedEnd);
    setStartLocation(endLocation);
    setSelectedEnd(tempStart);
    setEndLocation(tempStartLocation);
  };

  const handleClearRoute = () => {
    setStartLocation('');
    setEndLocation('');
    setSelectedStart(null);
    setSelectedEnd(null);
    setPath([]);
    setDistance(0);
    setInstructions([]);
    setError('');
  };

  const handleMapNodeClick = (nodeId, node) => {
    if (editorMode) return;
    if (node.type === 'corridor') return;

    // Open sidebar to show details/context (Desktop only mostly, or expand on mobile)
    setSidebarOpen(true);

    const location = { id: nodeId, label: node.label, type: node.type };

    if (!selectedStart) {
      handleStartSelect(location);
      return;
    }
    if (selectedStart.id === nodeId) {
      setError('Start and destination cannot be the same');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!selectedEnd || selectedEnd.id !== nodeId) {
      handleEndSelect(location);
      return;
    }
    // Deselect if clicking same end node
    if (selectedEnd.id === nodeId) {
      setSelectedEnd(null);
      setEndLocation('');
      setPath([]);
      setDistance(0);
      setError('');
    }
  };

  // Determine current page state - simplified to 2 pages
  // Page 1: Campus Overview & Quick Navigate
  // Page 2: Route Steps & Navigation (combined)
  const currentPage = !selectedEnd ? 1 : 2;

  const handleStartNavigation = () => {
    setIsNavigating(true);
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false); // Close sidebar to focus on map/overlay
    }
  };

  const handleBackToPage1 = () => {
    handleClearRoute();
    setSidebarOpen(true);
  };

  return (
    <div className={`app page-${currentPage}`}>

      {/* --- 1. Independent Floating Toggle Button (Desktop/Mobile) --- */}
      <div className={`floating-menu-trigger ${!sidebarOpen && !editorMode ? 'visible' : ''}`}>
        <button
          className="glass-btn"
          onClick={() => setSidebarOpen(true)}
          title="Open Navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* --- 2. Sidebar / Bottom Sheet Wrapper --- */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'expanded' : 'closed'} ui-page-${currentPage}`}>

        {/* Container 1: Header & Search (Top Island) */}
        <div className="panel-card header-island">
          <div className="sidebar-header">
            <div className="brand">
              <div className="brand-icon">
                <MapPin size={18} />
              </div>
              <div className="brand-text">
                <h1>Campus 25</h1>
              </div>
            </div>
            {currentPage === 1 ? (
              <button className="close-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <ChevronLeft size={20} />
              </button>
            ) : (
              <button className="clear-text-btn" onClick={handleBackToPage1}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
          </div>

          {currentPage === 1 ? (
            <div className="search-section">
              <div className="search-group">
                <div className="search-label-row">
                  <div className="dot-indicator dot-start"></div>
                  <span>Start Location</span>
                </div>
                <SearchBar
                  value={startLocation}
                  onChange={(val) => {
                    setStartLocation(val);
                    if (path.length > 0) setPath([]);
                  }}
                  onSelect={handleStartSelect}
                  placeholder="Search start point..."
                />
              </div>

              <div className="swap-container">
                <button
                  className="swap-btn"
                  onClick={handleSwapLocations}
                  disabled={!selectedStart || !selectedEnd}
                  title="Swap locations"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

              <div className="search-group">
                <div className="search-label-row">
                  <div className="dot-indicator dot-end"></div>
                  <span>Destination</span>
                </div>
                <SearchBar
                  value={endLocation}
                  onChange={(val) => {
                    setEndLocation(val);
                    if (path.length > 0) setPath([]);
                  }}
                  onSelect={handleEndSelect}
                  placeholder="Search destination..."
                />
              </div>

              {error && (
                <div className="error-banner">
                  <span className="error-icon">⚠</span> {error}
                </div>
              )}
            </div>
          ) : (
            /* PAGE 2 & 3 HEADER */
            <div className="search-section animate-in">
              <div className="route-header-compact">
                <div className="route-points">
                  <div className="point-row">
                    <div className="dot-indicator dot-start"></div>
                    <span className="point-label">{startLocation}</span>
                  </div>
                  <div className="connector-line"></div>
                  <div className="point-row">
                    <div className="dot-indicator dot-end"></div>
                    <span className="point-label">{endLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Container 2: Actions & Results (Scrollable Island) */}
        <div className="panel-card action-island">
          <div className="scroll-container">
            {currentPage === 1 ? (
              <QuickActions
                key="actions"
                onQuickAction={handleQuickAction}
                currentLocation={selectedStart}
              />
            ) : (
              <RouteInfo
                key="route-info"
                path={path}
                instructions={instructions}
                distance={distance}
                startLabel={startLocation}
                endLabel={endLocation}
                isNavigating={isNavigating}
                onStartNavigation={handleStartNavigation}
              />
            )}
          </div>
        </div>

      </div>

      {/* Map Controls (Top Right) hidden as per user request */}
      {/* <div className="map-controls-group">
        <button
          className={`glass-btn ${highContrast ? 'active' : ''}`}
          onClick={() => setHighContrast(!highContrast)}
          title={highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
        >
          <Eye size={20} />
        </button>
        <button
          className={`glass-btn ${editorMode ? 'active' : ''}`}
          onClick={toggleEditorMode}
          title={editorMode ? 'Exit Editor Mode' : 'Enter Editor Mode'}
        >
          <Edit3 size={20} />
        </button>
<<<<<<< HEAD

         

      </div>
=======
      </div> */}
>>>>>>> d99c3b88e01284855915b41a5c2c16e1f80056d4

      {/* --- Fullscreen Map --- */}
      <div className="map-fullscreen">
        <FloorMap
          path={path}
          highlightedNodes={[selectedStart?.id, selectedEnd?.id].filter(Boolean)}
          onNodeClick={handleMapNodeClick}
          selectedStart={selectedStart}
          selectedEnd={selectedEnd}
          editorMode={editorMode}
          isNavigating={isNavigating}
        />
      </div>

      <NavigationOverlay path={isNavigating ? path : null} onBack={null} />
    </div>
  );
}

export default App;
