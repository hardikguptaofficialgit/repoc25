import React, { useState, useEffect } from 'react';
import FloorMap from './components/Map/FloorMap';
import SearchBar from './components/Navigation/SearchBar';
import RouteInfo from './components/Navigation/RouteInfo';
import QuickActions from './components/Navigation/QuickActions';
import NavigationOverlay from './components/Navigation/NavigationOverlay';
import { buildGraph, getNodesByFloor } from './utils/graphBuilder';
import { findShortestPath, findNearestPOI } from './utils/pathfinding';
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
  const [currentFloor, setCurrentFloor] = useState(0);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);

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

    const result = findNearestPOI(graph, selectedStart.id, availableTargets);
    if (result.error || !result.target) {
      setError(result.error || `No ${poiType.replace(/_/g, ' ')} found on ${currentFloor === 0 ? 'Ground' : currentFloor + 'F'}`);
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
    setError('');
  };

  const handleMapNodeClick = (nodeId, node) => {
    if (editorMode) return;
    if (node.type === 'corridor') return;

    setSidebarOpen(true);

    const location = { id: nodeId, label: node.label, type: node.type };

    if (!selectedStart) {
      handleStartSelect(location);
      return;
    }
    if (selectedStart.id === nodeId) {
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
    }
  };

  return (
    <div className="app">

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
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>

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
          <QuickActions
            onQuickAction={handleQuickAction}
            currentLocation={selectedStart}
            minimized={path.length > 0}
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
        />
      </div>

      <NavigationOverlay path={path} />
    </div>
  );
}

export default App;