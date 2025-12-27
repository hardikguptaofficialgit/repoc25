import React, { useState, useEffect } from 'react';
import FloorMap from './components/Map/FloorMap';
import SearchBar from './components/Navigation/SearchBar';
import RouteInfo from './components/Navigation/RouteInfo';
import QuickActions from './components/Navigation/QuickActions';
import CampusOverview from './components/UI/CampusOverview';
import NavigationOverlay from './components/Navigation/NavigationOverlay';
import RoutePreview from './components/Navigation/RoutePreview';
import AdminLogin from './components/Admin/AdminLogin';
import { buildGraph, getNodesByFloor } from './utils/graphBuilder';
import { findShortestPath, findNearestPOI } from './utils/pathfinding';
import { nodes, poiCategories } from './data/buildingData';
import { ArrowUpDown, Menu, ChevronLeft, Building, ChevronDown, User, Bell, X, Lock, MapPin, Circle } from 'lucide-react';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'preview', 'navigation'

  useEffect(() => {
    const builtGraph = buildGraph();
    setGraph(builtGraph);
  }, []);

  useEffect(() => {
    if (selectedStart && selectedEnd && graph) {
      calculateRoute(selectedStart.id, selectedEnd.id);
      if (currentView === 'overview') {
        setCurrentView('preview');
      }
    } else if (!selectedStart || !selectedEnd) {
      if (currentView === 'preview') {
        setCurrentView('overview');
      }
    }
  }, [selectedStart, selectedEnd, graph]);

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
    setCurrentView('overview');
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
  };

  const handleStartNavigation = () => {
    setCurrentView('navigation');
    // Keep sidebar open but content will be hidden via CSS
  };

  const handleGoBack = () => {
    if (currentView === 'preview') {
      setCurrentView('overview');
      handleClearRoute();
    } else if (currentView === 'navigation') {
      setCurrentView('preview');
    }
  };

  const handleAdminAuth = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    setShowProfileMenu(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setEditorMode(false);
    setShowProfileMenu(false);
    localStorage.removeItem('adminSession');
  };


  return (
    <div className="app">
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="main-ui-container">

          {currentView === 'overview' && (
            <>
              {/* Header Section */}
              <div className="premium-header">
                <div className="logo-section">
                  <div className="app-logo">
                    <MapPin size={22} color="#fff" />
                  </div>
                  <div className="app-titles">
                    <h1>Campus 25</h1>
                  </div>
                </div>
                <div className="header-actions">
                  <div className="floor-selector-header">
                    <button
                      className="floor-mini-btn"
                      onClick={() => setShowFloorDropdown(!showFloorDropdown)}
                    >
                      {currentFloor === 0 ? 'GF' : `${currentFloor}F`}
                      <ChevronDown size={14} />
                    </button>
                    {showFloorDropdown && (
                      <div className="floor-dropdown-mini glass-panel">
                        {[3, 2, 1, 0].map(f => (
                          <button
                            key={f}
                            className={f === currentFloor ? 'selected' : ''}
                            onClick={() => { setCurrentFloor(f); setShowFloorDropdown(false); }}
                          >
                            {f === 0 ? 'GF' : `${f}F`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="profile-wrapper">
                    <button
                      className={`profile-btn ${showProfileMenu ? 'active' : ''}`}
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                      <User size={20} />
                      {isAdmin && <div className="admin-badge-dot" />}
                    </button>

                    {showProfileMenu && (
                      <div className="profile-dropdown glass-panel animate-in">
                        <div className="dropdown-header">
                          <div className="user-avatar">
                            {isAdmin ? <Lock size={16} /> : <User size={16} />}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{isAdmin ? 'Administrator' : 'Guest User'}</span>
                            <span className="user-role">{isAdmin ? 'Full Access' : 'View Only'}</span>
                          </div>
                        </div>

                        <div className="dropdown-divider" />

                        <div className="dropdown-actions">
                          {isAdmin ? (
                            <>
                              <button
                                className={`dropdown-item ${editorMode ? 'active' : ''}`}
                                onClick={() => { setEditorMode(!editorMode); setShowProfileMenu(false); }}
                              >
                                <Building size={16} />
                                <span>{editorMode ? 'Disable Editor' : 'Enable Editor'}</span>
                              </button>
                              <button className="dropdown-item logout" onClick={handleLogout}>
                                <X size={16} />
                                <span>Logout</span>
                              </button>
                            </>
                          ) : (
                            <button className="dropdown-item login" onClick={() => { setShowAdminLogin(true); setShowProfileMenu(false); }}>
                              <Lock size={16} />
                              <span>Admin Login</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {showAdminLogin && (
                  <AdminLogin
                    onLogin={handleAdminAuth}
                    onClose={() => setShowAdminLogin(false)}
                  />
                )}
              </div>

              {/* Search Section */}
              <div className="search-composite">
                <div className="search-row">
                  <div className="card-label">
                    <Circle size={12} className="label-dot start" />
                    <span>START LOCATION</span>
                  </div>
                  <SearchBar
                    value={startLocation}
                    onChange={setStartLocation}
                    onSelect={handleStartSelect}
                    placeholder="Search start point..."
                    floor={currentFloor}
                  />
                </div>

                <div className="search-row bottom">
                  <div className="card-label">
                    <Circle size={12} className="label-dot destination" fill="currentColor" />
                    <span>DESTINATION</span>
                  </div>
                  <SearchBar
                    value={endLocation}
                    onChange={setEndLocation}
                    onSelect={handleEndSelect}
                    placeholder="Search destination..."
                    floor={currentFloor}
                  />
                </div>
              </div>

              {/* Campus Overview Stat Block */}
              <CampusOverview />

              {/* Quick Navigation Section */}
              <QuickActions
                onQuickAction={handleQuickAction}
                currentLocation={selectedStart}
                minimized={path.length > 0}
              />

            </>
          )}

          {currentView === 'preview' && (
            <RoutePreview
              path={path}
              distance={distance}
              startLabel={startLocation}
              endLabel={endLocation}
              onBack={handleGoBack}
              onStartNavigation={handleStartNavigation}
            />
          )}

          {currentView === 'navigation' && (
            <div className="navigation-view-empty">
              {/* Sidebar is retracted, map is primary */}
            </div>
          )}

        </div>
      </div>

      {/* Map Layer */}
      <div className="map-fullscreen">
        <FloorMap
          path={path}
          highlightedNodes={[selectedStart?.id, selectedEnd?.id].filter(Boolean)}
          onNodeClick={handleMapNodeClick}
          selectedStart={selectedStart}
          selectedEnd={selectedEnd}
          editorMode={editorMode}
          currentFloor={currentFloor}
          autoFitPath={currentView === 'navigation'}
        />

        {/* Floating Navigation Controls */}
        {currentView === 'navigation' && (
          <>
            <div className="live-nav-controls">
              <button className="exit-nav-fab" onClick={handleClearRoute}>
                <X size={20} />
              </button>
            </div>
            <NavigationOverlay path={path} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
