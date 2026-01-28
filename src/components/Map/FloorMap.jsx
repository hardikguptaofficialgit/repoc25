import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Image, RegularPolygon } from 'react-konva';
import { nodes as initialNodes, edges as initialEdges } from '../../data/buildingData';
import { getNodesByFloor } from '../../utils/graphBuilder';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Download, Grid3X3, X, Plus, Trash2, Link, MousePointer, Upload, Trash, RefreshCw } from 'lucide-react';
import './FloorMap.css';

// -----------------------------------------------------------------------------
// Color Palette System - Theme Aware
// -----------------------------------------------------------------------------
const getThemeAwarePalette = () => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    return {
        blockA: '#6366F1',       // Indigo for Block A
        blockB: '#F97316',       // Orange for Block B
        washroomG: '#0EA5E9',    // Sky Blue for Gents
        washroomL: '#EC4899',    // Pink for Ladies
        stairs: '#22C55E',       // Green
        lift: '#A855F7',         // Purple
        entrance: '#EAB308',     // Yellow
        office: '#F43F5E',       // Rose
        lab: '#14B8A6',          // Teal
        library: '#8B5CF6',      // Violet for Library
        corridor: isDark ? '#404040' : '#94A3B8',     // Dark Grey in dark mode, Slate in light mode
        default: isDark ? '#64748B' : '#475569',      // Slate variations
        highlight: '#0EA5E9',    // Sky Blue for path highlight
        textColor: isDark ? '#FFFFFF' : '#0F172A',    // White in dark, Dark in light
        edgeColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)', // Edge visibility
        facilityBg: isDark ? '#000000' : '#FFFFFF'    // Facility container background
    };
};

// Palette moved to dynamic calculation inside component

// -----------------------------------------------------------------------------
// MapNode Component
// -----------------------------------------------------------------------------
const MapNode = memo(({
    nodeId,
    node,
    isSelected,
    isHovered,
    isInPath,
    isStart,
    isEnd,
    editorMode,
    isConnecting,
    onDrag,
    onClick,
    onHover,
    onLeave,
    palette // Add palette prop
}) => {
    const isCorridorNode = node.type === 'corridor';
    const isFacilityNode = ['washroom_gents', 'washroom_ladies', 'stairs', 'lift', 'entrance', 'water_cooler', 'cafeteria', 'seating', 'gate'].includes(node.type);

    // SIZE & SHAPE LOGIC
    const getNodeDimensions = (type) => {
        // Returns { width, height, cornerRadius }
        if (type === 'corridor') return { width: 12, height: 12, cornerRadius: 2 };
        if (isFacilityNode) return { width: 36, height: 36, cornerRadius: 18 }; // Circular container for facilities
        if (type === 'washroom_gents' || type === 'washroom_ladies') return { width: 40, height: 30, cornerRadius: 4 };
        if (type === 'stairs' || type === 'lift') return { width: 35, height: 35, cornerRadius: 4 };
        if (type === 'entrance' || type === 'gate') return { width: 45, height: 25, cornerRadius: 6 };
        if (type === 'office' || type === 'lab' || type === 'library') return { width: 50, height: 35, cornerRadius: 4 };
        // Default for classrooms
        return { width: 45, height: 30, cornerRadius: 4 };
    };

    // COLOR LOGIC
    const getNodeStyle = (type, label) => {
        let fill = palette.default;
        let stroke = palette.edgeColor;

        // 1. Facility nodes get theme-aware containers
        if (isFacilityNode) {
            fill = palette.facilityBg; // Theme-aware container
            stroke = palette.textColor; // Theme-aware border
        }
        // 2. Specific Functional Types take priority (for non-facility nodes)
        else if (type === 'washroom_gents') fill = palette.washroomG;
        else if (type === 'washroom_ladies') fill = palette.washroomL;
        else if (type === 'stairs') fill = palette.stairs;
        else if (type === 'lift') fill = palette.lift;
        else if (type === 'entrance' || type === 'gate') fill = palette.entrance;
        else if (type === 'office') fill = palette.office;
        else if (type === 'lab') fill = palette.lab;
        else if (type === 'library') fill = palette.library;
        else if (type === 'corridor') fill = palette.corridor;

        // 3. Block Logic (if not a special type, check Label for A/B)
        else if (label) {
            const firstChar = label.trim().charAt(0).toUpperCase();
            if (firstChar === 'A') fill = palette.blockA;
            else if (firstChar === 'B') fill = palette.blockB;
        }

        return { fill, stroke };
    };

    let { fill, stroke } = getNodeStyle(node.type, node.label);
    let { width, height, cornerRadius } = getNodeDimensions(node.type);
    let strokeWidth = 2;

    // Store original facility color for selection state
    const getFacilityCategoryColor = (type) => {
        if (type === 'washroom_gents') return palette.washroomG;
        if (type === 'washroom_ladies') return palette.washroomL;
        if (type === 'stairs') return palette.stairs;
        if (type === 'lift') return palette.lift;
        if (type === 'entrance' || type === 'gate') return palette.entrance;
        if (type === 'water_cooler') return palette.washroomG; // Using blue for water cooler
        if (type === 'cafeteria') return palette.lab; // Using teal for cafeteria
        if (type === 'seating') return palette.lift; // Using purple for seating
        return palette.default;
    };

    let iconColor = '#FFFFFF'; // Default icon color (will be overridden for facilities)

    // Set facility icon colors based on category in normal view
    if (isFacilityNode) {
        iconColor = getFacilityCategoryColor(node.type); // Use category color for icons

        // In editing mode, ensure icons are always visible with proper contrast
        if (editorMode) {
            // For black containers, use the category color as is (should be visible)
            // If container is not black (due to selection/start/end states), adjust icon color for contrast
            if (fill !== '#000000') {
                iconColor = '#000000'; // Black icon for colored containers
            }
        }
    }

    // State Overrides
    if (isInPath) {
        stroke = palette.highlight;
        strokeWidth = 3;
        if (!isStart && !isEnd) {
            fill = palette.highlight;
            width = Math.max(width * 0.7, 10);
            height = Math.max(height * 0.7, 10);
        }
    }

    if (isStart) {
        fill = '#22C55E'; // Green start
        stroke = '#fff';
        strokeWidth = 3;
        width = 50;
        height = 50;
        cornerRadius = 8;

        // Special handling for facility nodes when selected as start
        if (isFacilityNode) {
            fill = getFacilityCategoryColor(node.type); // Container fills with category color
            iconColor = editorMode ? '#000000' : '#FFFFFF'; // Icon changes based on mode for contrast
        }
    }

    if (isEnd) {
        fill = '#EF4444'; // Red end
        stroke = '#fff';
        strokeWidth = 3;
        width = 50;
        height = 50;
        cornerRadius = 8;

        // Special handling for facility nodes when selected as end
        if (isFacilityNode) {
            fill = getFacilityCategoryColor(node.type); // Container fills with category color
            iconColor = editorMode ? '#000000' : '#FFFFFF'; // Icon changes based on mode for contrast
        }
    }

    if (isSelected) {
        stroke = '#fff';
        strokeWidth = 3;
        width = width * 1.15;
        height = height * 1.15;

        // Special handling for facility nodes when selected
        if (isFacilityNode) {
            fill = getFacilityCategoryColor(node.type); // Container fills with category color
            iconColor = editorMode ? '#000000' : '#FFFFFF'; // Icon changes based on mode for contrast
        } else {
            // For regular nodes, keep the original fill color from palette
            // Don't override with red, use the existing palette-based fill
        }
    }

    if (isConnecting) {
        stroke = '#fff';
        strokeWidth = 2;
        fill = '#fbbf24';
    }

    // Visibility Check
    if (isCorridorNode && !editorMode && !isInPath) return null;

    return (
        <Group
            x={node.x}
            y={node.y}
            draggable={editorMode}
            onDragEnd={(e) => onDrag(nodeId, e.target.x(), e.target.y())}
            onClick={() => onClick(nodeId)}
            onTap={() => onClick(nodeId)}
            onMouseEnter={() => onHover(nodeId)}
            onMouseLeave={onLeave}
        >
            {/* Selection Glow */}
            {(isSelected || isHovered) && (
                <Rect
                    x={-width / 2 - 4}
                    y={-height / 2 - 4}
                    width={width + 8}
                    height={height + 8}
                    cornerRadius={cornerRadius + 2}
                    fill={fill}
                    opacity={0.3}
                    listening={false}
                />
            )}

            {/* Main Node Shape - Conditional rendering for facilities vs regular nodes */}
            {isFacilityNode ? (
                // Circular container for facility nodes
                <Circle
                    x={0}
                    y={0}
                    radius={width / 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    hitStrokeWidth={10}
                    shadowColor="black"
                    shadowBlur={6}
                    shadowOpacity={0.4}
                    shadowOffsetY={2}
                    shadowEnabled={isSelected || isHovered}
                />
            ) : (
                // Regular rectangular nodes
                <Rect
                    x={-width / 2}
                    y={-height / 2}
                    width={width}
                    height={height}
                    cornerRadius={cornerRadius}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    hitStrokeWidth={10}
                    shadowColor="black"
                    shadowBlur={6}
                    shadowOpacity={0.4}
                    shadowOffsetY={2}
                    shadowEnabled={isSelected || isHovered}
                />
            )}

            {/* Icon Rendering for Facility Nodes */}
            {isFacilityNode && (() => {
                const iconSize = Math.min(width, height) * 0.5;
                return (
                    <Group>
                        {/* ================= WASHROOM – GENTS ================= */}
                        {node.type === 'washroom_gents' && (
                            <Group>
                                {/* head */}
                                <Circle x={0} y={-iconSize * 0.45} radius={iconSize * 0.22} fill={iconColor} />
                                {/* shoulders */}
                                <Rect
                                    x={-iconSize * 0.35}
                                    y={-iconSize * 0.2}
                                    width={iconSize * 0.7}
                                    height={iconSize * 0.25}
                                    cornerRadius={iconSize * 0.1}
                                    fill={iconColor}
                                />
                                {/* body */}
                                <Rect
                                    x={-iconSize * 0.2}
                                    y={iconSize * 0.05}
                                    width={iconSize * 0.4}
                                    height={iconSize * 0.45}
                                    cornerRadius={iconSize * 0.08}
                                    fill={iconColor}
                                />
                                {/* legs */}
                                <Rect x={-iconSize * 0.18} y={iconSize * 0.5} width={iconSize * 0.14} height={iconSize * 0.28} fill={iconColor} />
                                <Rect x={iconSize * 0.04} y={iconSize * 0.5} width={iconSize * 0.14} height={iconSize * 0.28} fill={iconColor} />
                            </Group>
                        )}

                        {/* ================= WASHROOM – LADIES ================= */}
                        {/* ================= WASHROOM – LADIES (SIMPLIFIED, ADJUSTED) ================= */}
                        {node.type === 'washroom_ladies' && (
                            <Group>
                                {/* head */}
                                <Circle
                                    x={0}
                                    y={-iconSize * 0.55}
                                    radius={iconSize * 0.17}
                                    fill={iconColor}
                                />

                                {/* body + skirt (shorter triangle, shifted up) */}
                                <Line
                                    points={[
                                        0, -iconSize * 0.32,               // neck (up)
                                        iconSize * 0.38, iconSize * 0.45,  // right bottom (shorter)
                                        -iconSize * 0.38, iconSize * 0.45, // left bottom (shorter)
                                    ]}
                                    closed
                                    fill={iconColor}
                                />

                                {/* left leg */}
                                <Rect
                                    x={-iconSize * 0.14}
                                    y={iconSize * 0.45}
                                    width={iconSize * 0.11}
                                    height={iconSize * 0.32}
                                    cornerRadius={iconSize * 0.05}
                                    fill={iconColor}
                                />

                                {/* right leg */}
                                <Rect
                                    x={iconSize * 0.03}
                                    y={iconSize * 0.45}
                                    width={iconSize * 0.11}
                                    height={iconSize * 0.32}
                                    cornerRadius={iconSize * 0.05}
                                    fill={iconColor}
                                />
                            </Group>
                        )}


                        {/* ================= STAIRS ================= */}
                        {node.type === 'stairs' && (
                            <Group>
                                <Rect x={-iconSize * 0.45} y={iconSize * 0.35} width={iconSize * 0.9} height={iconSize * 0.15} fill={iconColor} />
                                <Rect x={-iconSize * 0.15} y={iconSize * 0.1} width={iconSize * 0.6} height={iconSize * 0.15} fill={iconColor} />
                                <Rect x={0} y={-iconSize * 0.15} width={iconSize * 0.45} height={iconSize * 0.15} fill={iconColor} />
                            </Group>
                        )}

                        {/* ================= LIFT ================= */}
                        {node.type === 'lift' && (
                            <Group>
                                <Rect
                                    x={-iconSize * 0.35}
                                    y={-iconSize * 0.5}
                                    width={iconSize * 0.7}
                                    height={iconSize * 0.95}
                                    cornerRadius={iconSize * 0.1}
                                    fill={iconColor}
                                />
                                {/* door split */}
                                <Line points={[0, -iconSize * 0.4, 0, iconSize * 0.4]} stroke={fill} strokeWidth={2} />
                                {/* arrows */}
                                <Line points={[-iconSize * 0.12, -iconSize * 0.35, 0, -iconSize * 0.55, iconSize * 0.12, -iconSize * 0.35]} stroke={fill} strokeWidth={2} />
                                <Line points={[-iconSize * 0.12, iconSize * 0.35, 0, iconSize * 0.55, iconSize * 0.12, iconSize * 0.35]} stroke={fill} strokeWidth={2} />
                            </Group>
                        )}

                        {/* ================= ENTRANCE / GATE ================= */}
                        {(node.type === 'entrance' || node.type === 'gate') && (
                            <Group>
                                <Rect
                                    x={-iconSize * 0.3}
                                    y={-iconSize * 0.5}
                                    width={iconSize * 0.6}
                                    height={iconSize * 0.95}
                                    cornerRadius={iconSize * 0.06}
                                    fill={iconColor}
                                />
                                <Circle x={iconSize * 0.15} y={0} radius={iconSize * 0.06} fill={fill} />
                            </Group>
                        )}

                        {/* ================= WATER COOLER ================= */}
                        {node.type === 'water_cooler' && (
                            <Group>
                                <Rect
                                    x={-iconSize * 0.14}
                                    y={-iconSize * 0.5}
                                    width={iconSize * 0.28}
                                    height={iconSize * 0.65}
                                    cornerRadius={iconSize * 0.14}
                                    fill={iconColor}
                                />
                                <Circle y={iconSize * 0.35} radius={iconSize * 0.14} fill={iconColor} />
                            </Group>
                        )}

                        {/* ================= CAFETERIA ================= */}
                        {node.type === 'cafeteria' && (
                            <Group>
                                <Rect
                                    x={-iconSize * 0.32}
                                    y={-iconSize * 0.22}
                                    width={iconSize * 0.64}
                                    height={iconSize * 0.44}
                                    cornerRadius={iconSize * 0.14}
                                    fill={iconColor}
                                />
                                <Line
                                    points={[
                                        iconSize * 0.32, -iconSize * 0.12,
                                        iconSize * 0.46, -iconSize * 0.12,
                                        iconSize * 0.46, iconSize * 0.12,
                                    ]}
                                    stroke={iconColor}
                                    strokeWidth={2}
                                />
                            </Group>
                        )}

                        {/* ================= SEATING ================= */}
                        {node.type === 'seating' && (
                            <Group>
                                <Rect x={-iconSize * 0.32} y={-iconSize * 0.1} width={iconSize * 0.64} height={iconSize * 0.18} fill={iconColor} />
                                <Rect x={-iconSize * 0.32} y={iconSize * 0.12} width={iconSize * 0.12} height={iconSize * 0.32} fill={iconColor} />
                                <Rect x={iconSize * 0.2} y={iconSize * 0.12} width={iconSize * 0.12} height={iconSize * 0.32} fill={iconColor} />
                            </Group>
                        )}

                        {/* ================= DEFAULT ================= */}
                        {![
                            'washroom_gents',
                            'washroom_ladies',
                            'stairs',
                            'lift',
                            'entrance',
                            'gate',
                            'water_cooler',
                            'cafeteria',
                            'seating',
                        ].includes(node.type) && (
                                <Circle radius={iconSize * 0.28} fill={iconColor} />
                            )}
                    </Group>
                );

            })()}

            {/* Label Rendering */}
            {(!isCorridorNode || editorMode) && (
                <Text
                    text={node.label || nodeId}
                    x={-60}
                    y={height / 2 + 6}
                    width={120}
                    align="center"
                    fontSize={10}
                    fontStyle="bold"
                    fontFamily="Inter, sans-serif"
                    fill={palette.textColor}
                    opacity={0.95}
                    listening={false}
                />
            )}
        </Group>
    );
});

// -----------------------------------------------------------------------------
// Main FloorMap Component
// -----------------------------------------------------------------------------
const FloorMap = ({
    path = [],
    onNodeClick = null,
    selectedStart = null,
    selectedEnd = null,
    editorMode = false,
    currentFloor = 0,
    centerOnPath = false,
    currentStep = 0
}) => {
    // Data State
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    // Theme State - force re-render on theme change
    const [currentTheme, setCurrentTheme] = useState(
        document.documentElement.getAttribute('data-theme') || 'dark'
    );

    // Calculate theme-aware palette efficiently
    const palette = React.useMemo(() => getThemeAwarePalette(), [currentTheme]);

    // Viewport State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const [initialCentered, setInitialCentered] = useState(false);

    // Interaction State
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [floorPlanImage, setFloorPlanImage] = useState(null);
    const [bgImageObj, setBgImageObj] = useState(null);
    const [bgImageOpacity, setBgImageOpacity] = useState(0.5);
    const [showGrid, setShowGrid] = useState(editorMode);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [is3D, setIs3D] = useState(false);
    const [pathOffset, setPathOffset] = useState(0);
    const [rotation, setRotation] = useState(0);

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                    setCurrentTheme(newTheme);
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    const recenterMap = useCallback(() => {
        if (stageSize.width > 0 && stageSize.height > 0) {
            centerMapToFit();
            setRotation(0); // Reset rotation when recentering
        }
    }, [stageSize]);

    // Editor Tools State
    const [editorTool, setEditorTool] = useState('select');
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [tempLineEnd, setTempLineEnd] = useState(null);
    const [activeNodeType, setActiveNodeType] = useState('corridor');
    const [newNodeCounter, setNewNodeCounter] = useState(1000);

    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const fileInputRef = useRef(null);

    // -----------------------------------------------------------------------------
    // Helper Functions
    // -----------------------------------------------------------------------------

    // Center map to fit all nodes or specific path
    const centerMapToFit = useCallback((targetNodes = null) => {
        if (stageSize.width === 0 || stageSize.height === 0) return;

        const nodesToFit = targetNodes || Object.values(nodes);
        if (nodesToFit.length === 0) return;

        // Calculate bounding box
        const xs = nodesToFit.map(n => n.x);
        const ys = nodesToFit.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Calculate scale to fit with padding
        const padding = targetNodes ? 40 : 20; // Minimal padding for max zoom
        const scaleX = (stageSize.width - padding * 2) / boundsWidth;
        const scaleY = (stageSize.height - padding * 2) / boundsHeight;
        const newScale = Math.min(scaleX, scaleY, 5); // Max 5x zoom for closer view

        // Calculate position to center
        const newPosition = {
            x: stageSize.width / 2 - centerX * newScale,
            y: stageSize.height / 2 - centerY * newScale
        };

        setScale(newScale);
        setPosition(newPosition);
    }, [nodes, stageSize]);

    // -----------------------------------------------------------------------------
    // Effects
    // -----------------------------------------------------------------------------

    // Initial centering on load
    useEffect(() => {
        if (!initialCentered && stageSize.width > 0 && stageSize.height > 0 && Object.keys(nodes).length > 0) {
            centerMapToFit();
            setInitialCentered(true);
        }
    }, [stageSize, nodes, initialCentered, centerMapToFit]);

    // Auto-center on path selection
    useEffect(() => {
        if (centerOnPath && path.length > 0 && stageSize.width > 0 && stageSize.height > 0) {
            const pathNodes = path.map(id => nodes[id]).filter(Boolean);
            if (pathNodes.length > 0) {
                centerMapToFit(pathNodes);
            }
        }
    }, [centerOnPath, path, nodes, stageSize, centerMapToFit]);

    // Re-center when floor changes
    useEffect(() => {
        if (initialCentered && stageSize.width > 0 && stageSize.height > 0) {
            // Small delay to let nodes update
            const timer = setTimeout(() => {
                // If there's a path, center on path nodes, otherwise center on all
                if (path.length > 0) {
                    const pathNodes = path.map(id => nodes[id]).filter(Boolean);
                    if (pathNodes.length > 0) {
                        centerMapToFit(pathNodes);
                        return;
                    }
                }
                centerMapToFit();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentFloor, initialCentered, stageSize, centerMapToFit, path, nodes]);

    // Load background image
    useEffect(() => {
        if (floorPlanImage) {
            const img = new window.Image();
            img.src = floorPlanImage;
            img.onload = () => {
                setBgImageObj(img);
            };
        } else {
            setBgImageObj(null);
        }
    }, [floorPlanImage]);

    // Resize observer
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect) {
                    setStageSize({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                }
            }
        });
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [isFullscreen]);

    // 3. Key Listeners
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (connectingFrom) {
                    setConnectingFrom(null);
                    setTempLineEnd(null);
                } else if (selectedNode) {
                    setSelectedNode(null);
                } else if (isFullscreen) {
                    setIsFullscreen(false);
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen, connectingFrom, selectedNode]);

    // Path animation effect
    useEffect(() => {
        let animId;
        const animate = () => {
            setPathOffset(prev => (prev + 1) % 40);
            animId = requestAnimationFrame(animate);
        };
        if (path.length > 0) {
            animId = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(animId);
    }, [path]);

    // Handlers
    const handleNodeDrag = useCallback((nodeId, x, y) => {
        if (editorTool !== 'select') return;
        setNodes(prev => ({
            ...prev,
            [nodeId]: { ...prev[nodeId], x: Math.round(x), y: Math.round(y) }
        }));
    }, [editorTool]);

    const handleNodeClick = useCallback((nodeId) => {
        if (!editorMode) {
            if (onNodeClick && nodes[nodeId]?.type !== 'corridor') {
                onNodeClick(nodeId, nodes[nodeId]);
            }
            return;
        }

        switch (editorTool) {
            case 'select': setSelectedNode(nodeId); break;
            case 'connect':
                if (!connectingFrom) setConnectingFrom(nodeId);
                else if (connectingFrom !== nodeId) {
                    const exists = edges.some(e => (e[0] === connectingFrom && e[1] === nodeId) || (e[0] === nodeId && e[1] === connectingFrom));
                    if (!exists) {
                        const n1 = nodes[connectingFrom], n2 = nodes[nodeId];
                        const dist = Math.round(Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2)));
                        setEdges(prev => [...prev, [connectingFrom, nodeId, dist]]);
                    }
                    setConnectingFrom(null); setTempLineEnd(null);
                }
                break;
            case 'delete':
                setEdges(prev => prev.filter(e => e[0] !== nodeId && e[1] !== nodeId));
                setNodes(prev => { const next = { ...prev }; delete next[nodeId]; return next; });
                if (selectedNode === nodeId) setSelectedNode(null);
                break;
            default: break;
        }
    }, [editorMode, editorTool, connectingFrom, nodes, edges, onNodeClick, selectedNode]);

    const handleStageClick = useCallback((e) => {
        if (!editorMode) return;
        if (e.target === stageRef.current && editorTool === 'select') {
            setSelectedNode(null);
            return;
        }
        if (editorTool === 'addNode') {
            const stage = stageRef.current;
            const pointer = stage.getPointerPosition();
            const x = Math.round((pointer.x - position.x) / scale);
            const y = Math.round((pointer.y - position.y) / scale);
            const id = `node_${newNodeCounter}`;
            setNodes(prev => ({
                ...prev,
                [id]: { x, y, label: activeNodeType === 'corridor' ? '' : 'New Node', type: activeNodeType }
            }));
            setNewNodeCounter(prev => prev + 1);
            setEditorTool('select');
            setSelectedNode(id);
        }
    }, [editorMode, editorTool, position, scale, newNodeCounter, activeNodeType]);

    const handleWheel = useCallback((e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };

        // Smoother zoom with smaller increments
        const zoomFactor = e.evt.deltaY > 0 ? 0.95 : 1.05;
        const newScale = Math.min(Math.max(oldScale * zoomFactor, 0.1), 5);
        setScale(newScale);
        setPosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    }, []);

    // Ultra-Smooth Multi-Touch Gestures (Google Maps Grade)
    // Frame-to-frame delta tracking with exponential smoothing
    const touchState = useRef({
        // Current frame values
        lastDist: 0,
        lastAngle: 0,
        lastCenter: null,

        // Multi-level smoothing for ultra-smooth rotation
        smoothedRotationVelocity: 0,
        rotationSmoothingFactor: 0.15, // Lower = smoother (0.15 for ultra-smooth)
        rotationBuffer: [], // Rolling buffer for additional smoothing
        bufferSize: 3, // Average last 3 frames

        // Gesture tracking
        isGesturing: false,
        gestureStartTime: 0,

        // Minimum thresholds to filter noise
        minRotationDelta: 0.3, // degrees (reduced for finer control)
        minZoomDelta: 0.001
    });

    // Optimized distance calculation
    const getTouchDistance = (touch1, touch2) => {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Get center point between two touches
    const getTouchCenter = (touch1, touch2) => ({
        x: (touch1.clientX + touch2.clientX) * 0.5,
        y: (touch1.clientY + touch2.clientY) * 0.5
    });

    // Get rotation angle between two touches (in radians for precision)
    const getTouchAngle = (touch1, touch2) => {
        return Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        );
    };

    // Normalize angle to -PI to PI range
    const normalizeAngle = (angle) => {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    };

    // Convert radians to degrees
    const toDegrees = (rad) => rad * (180 / Math.PI);
    const toRadians = (deg) => deg * (Math.PI / 180);

    const handleTouchStart = (e) => {
        if (e.evt.touches.length === 2) {
            e.evt.preventDefault();
            const touch1 = e.evt.touches[0];
            const touch2 = e.evt.touches[1];

            const center = getTouchCenter(touch1, touch2);
            const dist = getTouchDistance(touch1, touch2);
            const angle = getTouchAngle(touch1, touch2);

            // Initialize with current frame values
            touchState.current = {
                lastDist: dist,
                lastAngle: angle,
                lastCenter: center,
                smoothedRotationVelocity: 0,
                rotationSmoothingFactor: 0.15,
                rotationBuffer: [],
                bufferSize: 3,
                isGesturing: true,
                gestureStartTime: Date.now(),
                minRotationDelta: 0.3,
                minZoomDelta: 0.001
            };
        }
    };

    const handleTouch = (e) => {
        // Only handle two-finger gestures
        if (e.evt.touches.length !== 2) {
            if (touchState.current.isGesturing) {
                touchState.current.isGesturing = false;
            }
            return;
        }

        e.evt.preventDefault();
        e.evt.stopPropagation();

        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        // Initialize if not already gesturing
        if (!touchState.current.isGesturing) {
            const center = getTouchCenter(touch1, touch2);
            const dist = getTouchDistance(touch1, touch2);
            const angle = getTouchAngle(touch1, touch2);

            touchState.current = {
                lastDist: dist,
                lastAngle: angle,
                lastCenter: center,
                smoothedRotationVelocity: 0,
                rotationSmoothingFactor: 0.15,
                rotationBuffer: [],
                bufferSize: 3,
                isGesturing: true,
                gestureStartTime: Date.now(),
                minRotationDelta: 0.3,
                minZoomDelta: 0.001
            };
            return;
        }

        const stage = stageRef.current;
        if (!stage) return;

        // Calculate current gesture values
        const currentDist = getTouchDistance(touch1, touch2);
        const currentCenter = getTouchCenter(touch1, touch2);
        const currentAngle = getTouchAngle(touch1, touch2);

        // Get stage bounding box for coordinate conversion
        const stageBox = stage.container().getBoundingClientRect();
        const centerPoint = {
            x: currentCenter.x - stageBox.left,
            y: currentCenter.y - stageBox.top
        };

        // === 1. SMOOTH PINCH ZOOM ===
        if (touchState.current.lastDist > 0) {
            // Calculate zoom delta from last frame
            const distDelta = currentDist - touchState.current.lastDist;
            const zoomDelta = distDelta / touchState.current.lastDist;

            // Only apply if above noise threshold
            if (Math.abs(zoomDelta) > touchState.current.minZoomDelta) {
                const newScale = Math.min(Math.max(scale * (1 + zoomDelta), 0.1), 5);

                // Calculate the point in canvas space that should stay fixed
                const pointTo = {
                    x: (centerPoint.x - position.x) / scale,
                    y: (centerPoint.y - position.y) / scale
                };

                // Calculate new position to keep the pinch center fixed
                const newPos = {
                    x: centerPoint.x - pointTo.x * newScale,
                    y: centerPoint.y - pointTo.y * newScale
                };

                setScale(newScale);
                setPosition(newPos);
            }
        }

        // === 2. SMOOTH TWO-FINGER PAN ===
        if (touchState.current.lastCenter) {
            const dx = currentCenter.x - touchState.current.lastCenter.x;
            const dy = currentCenter.y - touchState.current.lastCenter.y;

            // Apply panning
            setPosition(prev => ({
                x: prev.x + dx,
                y: prev.y + dy
            }));
        }

        // === 3. ULTRA-SMOOTH 360° ROTATION ===
        if (touchState.current.lastAngle !== null) {
            // Calculate frame-to-frame angle delta (in radians)
            let angleDelta = normalizeAngle(currentAngle - touchState.current.lastAngle);
            const angleDeltaDeg = toDegrees(angleDelta);

            // Only apply if above noise threshold
            if (Math.abs(angleDeltaDeg) > touchState.current.minRotationDelta) {
                // LEVEL 1: Rolling buffer smoothing (average last N frames)
                touchState.current.rotationBuffer.push(angleDeltaDeg);
                if (touchState.current.rotationBuffer.length > touchState.current.bufferSize) {
                    touchState.current.rotationBuffer.shift(); // Remove oldest
                }

                // Calculate buffer average
                const bufferAverage = touchState.current.rotationBuffer.reduce((sum, val) => sum + val, 0) /
                    touchState.current.rotationBuffer.length;

                // LEVEL 2: Exponential moving average for additional smoothness
                const smoothingFactor = touchState.current.rotationSmoothingFactor;
                touchState.current.smoothedRotationVelocity =
                    smoothingFactor * bufferAverage +
                    (1 - smoothingFactor) * touchState.current.smoothedRotationVelocity;

                // Apply ultra-smoothed rotation
                const newRotation = rotation + touchState.current.smoothedRotationVelocity;

                // Optional: Snap to cardinal directions when close (within 3°)
                const snapThreshold = 3;
                const cardinalAngles = [0, 90, 180, 270, -90, -180, -270];
                let finalRotation = newRotation;

                // Only snap if rotation velocity is low (user is settling)
                if (Math.abs(touchState.current.smoothedRotationVelocity) < 0.8) {
                    for (let snapAngle of cardinalAngles) {
                        const normalizedNew = ((newRotation % 360) + 360) % 360;
                        const normalizedSnap = ((snapAngle % 360) + 360) % 360;
                        const diff = Math.min(
                            Math.abs(normalizedNew - normalizedSnap),
                            360 - Math.abs(normalizedNew - normalizedSnap)
                        );
                        if (diff < snapThreshold) {
                            finalRotation = snapAngle;
                            touchState.current.smoothedRotationVelocity = 0;
                            touchState.current.rotationBuffer = []; // Clear buffer on snap
                            break;
                        }
                    }
                }

                setRotation(finalRotation);
            }
        }

        // Update state for next frame
        touchState.current.lastDist = currentDist;
        touchState.current.lastAngle = currentAngle;
        touchState.current.lastCenter = currentCenter;
    };

    const handleTouchEnd = (e) => {
        // Reset gesture state when fingers are lifted
        if (e.evt.touches.length < 2) {
            touchState.current = {
                lastDist: 0,
                lastAngle: null,
                lastCenter: null,
                smoothedRotationVelocity: 0,
                rotationSmoothingFactor: 0.15,
                rotationBuffer: [],
                bufferSize: 3,
                isGesturing: false,
                gestureStartTime: 0,
                minRotationDelta: 0.3,
                minZoomDelta: 0.001
            };
        }
    };

    const exportData = () => {
        const data = `export const nodes = ${JSON.stringify(nodes, null, 2)};\n\nexport const edges = ${JSON.stringify(edges, null, 2)};`;
        navigator.clipboard.writeText(data).then(() => alert("Data copied to clipboard"));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFloorPlanImage(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFloorPlanImage(null);
        setBgImageObj(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const handleRotateRight = useCallback(() => {
        const cx = stageSize.width / 2;
        const cy = stageSize.height / 2;
        const angleDeg = 90;
        const rad = angleDeg * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Rotate position around center
        const dx = position.x - cx;
        const dy = position.y - cy;

        const newX = dx * cos - dy * sin + cx;
        const newY = dx * sin + dy * cos + cy;

        setRotation(prev => prev + 90);
        setPosition({ x: newX, y: newY });
    }, [stageSize, position]);

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete ALL nodes and edges? This cannot be undone.')) {
            setNodes({});
            setEdges([]);
            setSelectedNode(null);
            setConnectingFrom(null);
            setTempLineEnd(null);
        }
    };

    // Filter and Modify Nodes based on current floor
    const visibleNodes = React.useMemo(() => getNodesByFloor(currentFloor), [currentFloor]);

    // Internal Palette
    // Internal Palette - REMOVED (using dynamic palette)

    // Render Helpers
    // Determine which edges to show based on currentStep
    const renderedEdges = edges.map((edge, i) => {
        const [n1, n2] = edge;
        if (!visibleNodes[n1] || !visibleNodes[n2]) return null;

        // Check if this edge is part of the path
        const edgeIndexInPath = path.findIndex((id, idx) =>
            idx < path.length - 1 &&
            ((id === n1 && path[idx + 1] === n2) || (id === n2 && path[idx + 1] === n1))
        );
        const isPathEdge = edgeIndexInPath !== -1;

        // Use dynamic palette
        let strokeColor = palette.edgeColor;
        let strokeWidth = 6;
        let opacity = 0.5;

        if (editorMode) {
            strokeColor = palette.textColor;
            opacity = 0.4;
        }

        if (isPathEdge) {
            const isForward = path[edgeIndexInPath] === n1;
            const fromNode = isForward ? visibleNodes[n1] : visibleNodes[n2];
            const toNode = isForward ? visibleNodes[n2] : visibleNodes[n1];
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * 180 / Math.PI;

            // Check if this is the current step
            // Navigation instructions: [0: Start, 1-N: actual movements, Last: End]
            // Path edges: [0 to path.length-2]
            // So we need to map: instruction step 1 -> edge 0, step 2 -> edge 1, etc.
            const adjustedStep = currentStep > 0 ? currentStep - 1 : -1;
            const isCurrentStep = typeof currentStep === 'number' && adjustedStep === edgeIndexInPath;

            // All path edges are blue by default
            const baseColor = palette.highlight; // Blue

            return (
                <Group key={`path-${i}`}>
                    {/* Base path glow - always blue for all path segments */}
                    <Line
                        points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                        stroke={baseColor}
                        strokeWidth={12}
                        opacity={0.2}
                        lineCap="round"
                    />
                    {/* Base animated flow line - always blue */}
                    <Line
                        points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                        stroke={baseColor}
                        strokeWidth={5}
                        dash={[20, 20]}
                        dashOffset={-pathOffset}
                        lineCap="round"
                    />
                    {/* Base direction arrow - always blue */}
                    <RegularPolygon
                        x={(fromNode.x + toNode.x) / 2}
                        y={(fromNode.y + toNode.y) / 2}
                        sides={3}
                        radius={6}
                        fill={baseColor}
                        rotation={angle + 90}
                    />

                    {/* Pink overlay for current step only */}
                    {isCurrentStep && (
                        <>
                            {/* Outer pink glow - brightest */}
                            <Line
                                points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                                stroke="#FF1493"
                                strokeWidth={24}
                                opacity={0.4}
                                lineCap="round"
                            />
                            {/* Middle pink glow */}
                            <Line
                                points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                                stroke="#FF1493"
                                strokeWidth={18}
                                opacity={0.7}
                                lineCap="round"
                            />
                            {/* Pink animated line overlay - solid and bright */}
                            <Line
                                points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                                stroke="#FF1493"
                                strokeWidth={10}
                                dash={[20, 20]}
                                dashOffset={-pathOffset}
                                lineCap="round"
                                opacity={0.95}
                            />
                            {/* Pink arrow overlay - larger and brighter */}
                            <RegularPolygon
                                x={(fromNode.x + toNode.x) / 2}
                                y={(fromNode.y + toNode.y) / 2}
                                sides={3}
                                radius={12}
                                fill="#FF1493"
                                rotation={angle + 90}
                                opacity={0.95}
                            />
                        </>
                    )}
                </Group>
            );
        }

        return <Line key={i} points={[visibleNodes[n1].x, visibleNodes[n1].y, visibleNodes[n2].x, visibleNodes[n2].y]} stroke={strokeColor} strokeWidth={strokeWidth} opacity={opacity} lineCap="round" onClick={() => editorMode && editorTool === 'delete' && setEdges(prev => prev.filter((_, idx) => idx !== i))} />;
    });

    const renderedGrid = showGrid ? <Group>{Array.from({ length: 40 }).map((_, i) => <Line key={`v${i}`} points={[i * 50, -1000, i * 50, 2000]} stroke="#1e293b" strokeWidth={1} />)}{Array.from({ length: 40 }).map((_, i) => <Line key={`h${i}`} points={[-1000, i * 50, 2000, i * 50]} stroke="#1e293b" strokeWidth={1} />)}</Group> : null;

    const handleNodeLeave = useCallback(() => {
        setHoveredNode(null);
    }, []);

    return (
        <div className={`floor-map-container ${isFullscreen ? 'fullscreen' : ''} ${is3D ? 'view-3d' : ''}`} ref={containerRef}>

            {/* Controls Header */}
            <div className="map-ui-header">
                <div className="ui-group">
                    <button onClick={() => setScale(s => Math.min(s * 1.2, 5))} title="Zoom In"><ZoomIn size={18} /></button>
                    <button onClick={() => setScale(s => Math.max(s / 1.2, 0.1))} title="Zoom Out"><ZoomOut size={18} /></button>
                    <button onClick={handleRotateRight} title="Rotate 90°"><RotateCw size={18} /></button>
                    <button onClick={recenterMap} title="Recenter & Reset View"><RefreshCw size={18} /></button>
                </div>

                {editorMode && (
                    <div className="ui-group">
                        <button onClick={() => setShowGrid(!showGrid)} className={showGrid ? 'active' : ''}><Grid3X3 size={18} /></button>
                        <button onClick={exportData} title="Copy Data"><Download size={18} /></button>
                        <button onClick={handleClearAll} title="Delete All Nodes" style={{ color: '#EF4444' }}><Trash2 size={18} /></button>
                    </div>
                )}
            </div>

            {/* Editor Toolbar */}
            {editorMode && (
                <div className="map-editor-toolbar">
                    <div className="toolbar-label">TOOLS</div>
                    <button className={editorTool === 'select' ? 'active' : ''} onClick={() => setEditorTool('select')}><MousePointer size={16} /> Select</button>
                    <button className={editorTool === 'addNode' ? 'active' : ''} onClick={() => setEditorTool('addNode')}><Plus size={16} /> Add Node</button>
                    <button className={editorTool === 'connect' ? 'active' : ''} onClick={() => setEditorTool('connect')}><Link size={16} /> Connect</button>
                    <button className={editorTool === 'delete' ? 'active' : ''} onClick={() => setEditorTool('delete')}><Trash2 size={16} /> Delete</button>

                    <div className="toolbar-label" style={{ marginTop: '12px' }}>BACKGROUND</div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                    <button onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> {floorPlanImage ? 'Change' : 'Upload'}
                    </button>
                    {floorPlanImage && (
                        <>
                            <button onClick={handleRemoveImage} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                                <Trash size={16} /> Remove
                            </button>
                            <div className="tool-options">
                                <div className="toolbar-label">OPACITY</div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={bgImageOpacity}
                                    onChange={(e) => setBgImageOpacity(parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </>
                    )}

                    {editorTool === 'addNode' && (
                        <div className="tool-options">
                            <div className="toolbar-label">NODE TYPE</div>
                            <select value={activeNodeType} onChange={(e) => setActiveNodeType(e.target.value)}>
                                {['corridor', 'classroom', 'office', 'lab', 'lift', 'stairs', 'washroom_gents', 'washroom_ladies', 'entrance'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Properties Panel (Floating) */}
            {editorMode && selectedNode && nodes[selectedNode] && (
                <div className="editor-properties-panel">
                    <div className="panel-header">
                        <span>Edit Node</span>
                        <button onClick={() => setSelectedNode(null)}><X size={14} /></button>
                    </div>

                    <div className="panel-row">
                        <label>ID</label>
                        <input type="text" value={selectedNode} disabled className="disabled-input" />
                    </div>

                    <div className="panel-row">
                        <label>Label</label>
                        <input
                            type="text"
                            value={nodes[selectedNode].label || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNodes(prev => ({
                                    ...prev,
                                    [selectedNode]: { ...prev[selectedNode], label: val }
                                }));
                            }}
                            placeholder="e.g. A001, Main Gate"
                        />
                    </div>

                    <div className="panel-row">
                        <label>Type</label>
                        <select
                            value={nodes[selectedNode].type}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNodes(prev => ({
                                    ...prev,
                                    [selectedNode]: { ...prev[selectedNode], type: val }
                                }));
                            }}
                        >
                            <option value="corridor">Corridor (Grey)</option>
                            <option value="classroom">Classroom (Auto A/B)</option>
                            <option value="lab">Lab (Teal)</option>
                            <option value="office">Office (Rose)</option>
                            <option value="lift">Lift (Purple)</option>
                            <option value="stairs">Stairs (Green)</option>
                            <option value="washroom_gents">Gents Washroom (Blue)</option>
                            <option value="washroom_ladies">Ladies Washroom (Pink)</option>
                            <option value="entrance">Entrance (Yellow)</option>
                            <option value="water_cooler">Water Cooler (Blue)</option>
                            <option value="cafeteria">Cafeteria (Teal)</option>
                            <option value="seating">Seating (Purple)</option>
                            <option value="gate">Internal Gate (Yellow)</option>
                        </select>
                    </div>

                    <div className="panel-row coords">
                        <label>Pos</label>
                        <input
                            type="number"
                            value={nodes[selectedNode].x}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setNodes(prev => ({
                                    ...prev,
                                    [selectedNode]: { ...prev[selectedNode], x: val }
                                }));
                            }}
                        />
                        <input
                            type="number"
                            value={nodes[selectedNode].y}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setNodes(prev => ({
                                    ...prev,
                                    [selectedNode]: { ...prev[selectedNode], y: val }
                                }));
                            }}
                        />
                    </div>

                    <div className="panel-actions">
                        <button
                            className="delete-btn"
                            onClick={() => {
                                setEdges(prev => prev.filter(e => e[0] !== selectedNode && e[1] !== selectedNode));
                                setNodes(prev => { const next = { ...prev }; delete next[selectedNode]; return next; });
                                setSelectedNode(null);
                            }}
                        >
                            <Trash2 size={14} /> Delete Node
                        </button>
                    </div>
                </div>
            )}

            {/* Canvas */}
            {/* Canvas Container for 3D Transform */}
            <div className="canvas-wrapper">
                <Stage
                    ref={stageRef} width={stageSize.width} height={stageSize.height}
                    scaleX={scale} scaleY={scale} x={position.x} y={position.y}
                    rotation={rotation}
                    draggable={!editorMode || editorTool === 'select'}
                    onWheel={handleWheel} onClick={handleStageClick}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouch}
                    onTouchEnd={handleTouchEnd}
                    onMouseMove={(e) => { if (connectingFrom) { const pt = stageRef.current.getPointerPosition(); setTempLineEnd({ x: (pt.x - position.x) / scale, y: (pt.y - position.y) / scale }); } }}
                    onDragEnd={(e) => { if (e.target === stageRef.current) setPosition({ x: e.target.x(), y: e.target.y() }); }}
                >
                    <Layer listening={false}>
                        <Rect width={4000} height={4000} x={-1000} y={-1000} />
                        {bgImageObj && (
                            <Image
                                image={bgImageObj}
                                x={0}
                                y={0}
                                opacity={bgImageOpacity}
                            />
                        )}
                        {renderedGrid}
                    </Layer>
                    <Layer>
                        {renderedEdges}
                        {connectingFrom && tempLineEnd && <Line points={[visibleNodes[connectingFrom].x, visibleNodes[connectingFrom].y, tempLineEnd.x, tempLineEnd.y]} stroke="#fbbf24" strokeWidth={2} dash={[5, 5]} />}
                        {Object.entries(visibleNodes).map(([id, node]) => (
                            <MapNode key={`${currentFloor}-${id}`} nodeId={id} node={node}
                                isSelected={selectedNode === id} isHovered={hoveredNode === id}
                                isInPath={path.includes(id)} isStart={selectedStart?.id === id} isEnd={selectedEnd?.id === id}
                                editorMode={editorMode} isConnecting={connectingFrom === id}
                                onDrag={handleNodeDrag} onClick={handleNodeClick} onHover={setHoveredNode} onLeave={handleNodeLeave}
                                palette={palette}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            {/* Colored Legend */}
            {!editorMode && (
                <div className="map-legend-colored">
                    <div className="legend-row">
                        <div className="legend-item"><div className="dot" style={{ background: palette.blockA }}></div> Block A</div>
                        <div className="legend-item"><div className="dot" style={{ background: palette.blockB }}></div> Block B</div>
                        <div className="legend-item"><div className="dot" style={{ background: palette.stairs }}></div> Stairs</div>
                        <div className="legend-item"><div className="dot" style={{ background: palette.lift }}></div> Lift</div>
                    </div>
                    <div className="legend-row">
                        <div className="legend-item"><div className="dot" style={{ background: palette.washroomG }}></div> Gents</div>
                        <div className="legend-item"><div className="dot" style={{ background: palette.washroomL }}></div> Ladies</div>
                        <div className="legend-item"><div className="dot" style={{ background: palette.entrance }}></div> Entry</div>
                        <div className="legend-item"><div className="dot" style={{ background: palette.highlight, border: '1px solid #000' }}></div> Path</div>
                    </div>
                </div>
            )}
            {/* Attribution */}
            <div className="map-attribution">
                Developed by
                <img
                    src="https://uploads-ssl.webflow.com/629d87f593841156e4e0d9a4/62eeaa9927e6aea4ff13590e_FedLogo.png"
                    alt="FED Logo"
                    className="fed-logo"
                />
            </div>
        </div>
    );
};

export default FloorMap;