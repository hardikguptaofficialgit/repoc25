import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Image, RegularPolygon } from 'react-konva';
import { nodes as initialNodes, edges as initialEdges } from '../../data/buildingData';
import { getNodesByFloor } from '../../utils/graphBuilder';
import { ZoomIn, ZoomOut, RotateCcw, Download, Grid3X3, Maximize, Minimize, X, Plus, Trash2, Link, MousePointer, Upload, Trash, Layers, RefreshCw } from 'lucide-react';
import './FloorMap.css';

// -----------------------------------------------------------------------------
// Color Palette System
// -----------------------------------------------------------------------------
const PALETTE = {
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
    corridor: '#404040',     // Dark Grey
    default: '#64748B',      // Slate
    highlight: '#0EA5E9'     // Sky Blue for path highlight
};

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
    onLeave
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
        let fill = PALETTE.default;
        let stroke = 'rgba(255, 255, 255, 0.3)';

        // 1. Facility nodes get black containers by default
        if (isFacilityNode) {
            fill = '#000000'; // Black container for facilities
            stroke = '#FFFFFF'; // White border for facilities
        }
        // 2. Specific Functional Types take priority (for non-facility nodes)
        else if (type === 'washroom_gents') fill = PALETTE.washroomG;
        else if (type === 'washroom_ladies') fill = PALETTE.washroomL;
        else if (type === 'stairs') fill = PALETTE.stairs;
        else if (type === 'lift') fill = PALETTE.lift;
        else if (type === 'entrance' || type === 'gate') fill = PALETTE.entrance;
        else if (type === 'office') fill = PALETTE.office;
        else if (type === 'lab') fill = PALETTE.lab;
        else if (type === 'library') fill = PALETTE.library;
        else if (type === 'corridor') fill = PALETTE.corridor;

        // 3. Block Logic (if not a special type, check Label for A/B)
        else if (label) {
            const firstChar = label.trim().charAt(0).toUpperCase();
            if (firstChar === 'A') fill = PALETTE.blockA;
            else if (firstChar === 'B') fill = PALETTE.blockB;
        }

        return { fill, stroke };
    };

    let { fill, stroke } = getNodeStyle(node.type, node.label);
    let { width, height, cornerRadius } = getNodeDimensions(node.type);
    let strokeWidth = 2;

    // Store original facility color for selection state
    const getFacilityCategoryColor = (type) => {
        if (type === 'washroom_gents') return PALETTE.washroomG;
        if (type === 'washroom_ladies') return PALETTE.washroomL;
        if (type === 'stairs') return PALETTE.stairs;
        if (type === 'lift') return PALETTE.lift;
        if (type === 'entrance' || type === 'gate') return PALETTE.entrance;
        if (type === 'water_cooler') return PALETTE.washroomG; // Using blue for water cooler
        if (type === 'cafeteria') return PALETTE.lab; // Using teal for cafeteria
        if (type === 'seating') return PALETTE.lift; // Using purple for seating
        return PALETTE.default;
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
        stroke = PALETTE.highlight;
        strokeWidth = 3;
        if (!isStart && !isEnd) {
            fill = PALETTE.highlight;
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
                    fill="#FFFFFF"
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
    currentFloor = 0
}) => {
    // Data State
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    // Viewport State
    const [scale, setScale] = useState(0.85);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

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

    const recenterMap = useCallback(() => {
        setScale(0.85);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    }, []);

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
    // Effects
    // -----------------------------------------------------------------------------

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
        const newScale = Math.min(Math.max(oldScale * (e.evt.deltaY > 0 ? 0.9 : 1.1), 0.1), 5);
        setScale(newScale);
        setPosition({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    }, []);

    // Multi-touch Gesture Handling (Pinch & Rotate)
    const lastDist = useRef(0);
    const lastRotation = useRef(0);

    const handleTouch = (e) => {
        if (e.evt.touches.length !== 2) return;

        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        const dist = Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
        const angle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;

        if (!lastDist.current) {
            lastDist.current = dist;
            lastRotation.current = angle;
            return;
        }

        // Scaling
        const scaleFactor = dist / lastDist.current;
        setScale(prev => Math.min(Math.max(prev * scaleFactor, 0.1), 5));
        lastDist.current = dist;

        // Rotation
        const rotationDiff = angle - lastRotation.current;
        setRotation(prev => prev + rotationDiff);
        lastRotation.current = angle;
    };

    const handleTouchEnd = () => {
        lastDist.current = 0;
        lastRotation.current = 0;
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
    const INTERNAL_PALETTE = {
        blockA: '#6366F1',
        blockB: '#F97316',
        stairs: '#22C55E',
        lift: '#A855F7',
        washroomG: '#0EA5E9',
        washroomL: '#EC4899',
        entrance: '#EAB308',
        office: '#F43F5E',
        lab: '#14B8A6',
        library: '#8B5CF6',
        corridor: '#525252',     // Lighter Gray for corridors
        default: '#94A3B8',
        highlight: '#38BDF8'
    };

    // Render Helpers
    const renderedEdges = edges.map((edge, i) => {
        const [n1, n2] = edge;
        if (!visibleNodes[n1] || !visibleNodes[n2]) return null;
        const isPathEdge = path.some((id, idx) => idx < path.length - 1 && ((id === n1 && path[idx + 1] === n2) || (id === n2 && path[idx + 1] === n1)));

        let strokeColor = 'rgba(255, 255, 255, 0.3)'; // Increased from 0.15
        let strokeWidth = 6;                          // Increased from 5
        let opacity = 0.5;                             // Increased from 0.3

        if (editorMode) { strokeColor = '#737373'; opacity = 0.8; }

        if (isPathEdge) {
            const edgeIndex = path.findIndex((id, idx) => idx < path.length - 1 && ((id === n1 && path[idx + 1] === n2) || (id === n2 && path[idx + 1] === n1)));
            const isForward = path[edgeIndex] === n1;
            const fromNode = isForward ? visibleNodes[n1] : visibleNodes[n2];
            const toNode = isForward ? visibleNodes[n2] : visibleNodes[n1];
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) * 180 / Math.PI;

            return (
                <Group key={`path-${i}`}>
                    {/* Path glow */}
                    <Line
                        points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                        stroke={INTERNAL_PALETTE.highlight}
                        strokeWidth={12}
                        opacity={0.2}
                        lineCap="round"
                    />
                    {/* Animated flow line */}
                    <Line
                        points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                        stroke={INTERNAL_PALETTE.highlight}
                        strokeWidth={5}
                        dash={[20, 20]}
                        dashOffset={-pathOffset}
                        lineCap="round"
                    />
                    {/* Direction Arrow */}
                    <RegularPolygon
                        x={(fromNode.x + toNode.x) / 2}
                        y={(fromNode.y + toNode.y) / 2}
                        sides={3}
                        radius={6}
                        fill={INTERNAL_PALETTE.highlight}
                        rotation={angle + 90}
                    />
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
                    <button
                        onClick={() => setIs3D(!is3D)}
                        className={is3D ? 'active' : ''}
                        title="Toggle 3D View"
                    >
                        <Layers size={18} />
                    </button>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>
                    <button onClick={() => setScale(s => Math.min(s * 1.2, 5))} title="Zoom In"><ZoomIn size={18} /></button>
                    <button onClick={() => setScale(s => Math.max(s / 1.2, 0.1))} title="Zoom Out"><ZoomOut size={18} /></button>
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
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>

            {/* Colored Legend */}
            {!editorMode && (
                <div className="map-legend-colored">
                    <div className="legend-row">
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.blockA }}></div> Block A</div>
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.blockB }}></div> Block B</div>
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.stairs }}></div> Stairs</div>
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.lift }}></div> Lift</div>
                    </div>
                    <div className="legend-row">
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.washroomG }}></div> Gents</div>
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.washroomL }}></div> Ladies</div>
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.entrance }}></div> Entry</div>
                        <div className="legend-item"><div className="dot" style={{ background: PALETTE.highlight, border: '1px solid #000' }}></div> Path</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloorMap;