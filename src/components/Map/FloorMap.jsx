import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Image } from 'react-konva';
import { nodes as initialNodes, edges as initialEdges } from '../../data/buildingData';
import { ZoomIn, ZoomOut, RotateCcw, Download, Grid3X3, Maximize, Minimize, X, Plus, Trash2, Link, MousePointer, Upload, Trash } from 'lucide-react';
import './FloorMap.css';

// -----------------------------------------------------------------------------
// Integrated Color Palette (Premium)
// -----------------------------------------------------------------------------
const PALETTE = {
    blockA: '#6366F1',       // Indigo
    blockB: '#F97316',       // Orange
    washroomG: '#0EA5E9',    // Sky Blue
    washroomL: '#EC4899',    // Pink
    stairs: '#10B981',       // Emerald
    lift: '#8B5CF6',         // Violet
    entrance: '#F59E0B',     // Amber
    office: '#F43F5E',       // Rose
    lab: '#06B6D4',          // Cyan
    corridor: '#404040',     // Neutral Gray
    default: '#64748B',      // Slate
    highlight: '#FFFFFF',    // White

    // Node Strokes
    strokeDefault: 'rgba(255,255,255,0.3)',
    strokeSelected: '#FFFFFF'
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
    isDimmed,
    editorMode,
    isConnecting,
    onDrag,
    onClick,
    onHover,
    onLeave
}) => {
    const isCorridorNode = node.type === 'corridor';

    // COLOR LOGIC
    const getNodeStyle = (type, label) => {
        let fill = PALETTE.default;
        let radius = isCorridorNode ? 5 : 10;

        // 1. Specific Functional Types take priority
        if (type === 'washroom_gents') fill = PALETTE.washroomG;
        else if (type === 'washroom_ladies') fill = PALETTE.washroomL;
        else if (type === 'stairs') fill = PALETTE.stairs;
        else if (type === 'lift') fill = PALETTE.lift;
        else if (type === 'entrance' || type === 'gate') fill = PALETTE.entrance;
        else if (type === 'office') fill = PALETTE.office;
        else if (type === 'lab') fill = PALETTE.lab;
        else if (type === 'corridor') fill = PALETTE.corridor;

        // 2. Block Logic (if not a special type, check Label for A/B)
        else if (label) {
            const firstChar = label.trim().charAt(0).toUpperCase();
            if (firstChar === 'A') fill = PALETTE.blockA;
            else if (firstChar === 'B') fill = PALETTE.blockB;
        }

        return { fill, radius };
    };

    let { fill, radius } = getNodeStyle(node.type, node.label);
    let stroke = PALETTE.strokeDefault;
    let strokeWidth = 1.5;

    // State Overrides
    if (isInPath) {
        stroke = PALETTE.highlight;
        strokeWidth = 3;
        if (!isStart && !isEnd) {
            fill = PALETTE.highlight; // Path nodes turn white
            radius = 6;
        }
    }

    if (isStart) {
        fill = '#22C55E'; // Green start
        stroke = '#fff';
        strokeWidth = 3;
        radius = 12;
    }

    if (isEnd) {
        fill = '#EF4444'; // Red end
        stroke = '#fff';
        strokeWidth = 3;
        radius = 12;
    }

    if (isSelected) {
        stroke = '#fff';
        strokeWidth = 3;
        radius = radius * 1.25;
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
            {/* Selection/Hover Glow */}
            {(isSelected || isHovered) && (
                <Circle radius={radius + 6} fill={fill} opacity={0.25} listening={false} />
            )}

            <Circle
                radius={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                hitStrokeWidth={12}
                shadowColor="black"
                shadowBlur={8}
                shadowOpacity={0.4}
                shadowEnabled={true}
                opacity={isDimmed ? 0.3 : 1}
            />

            {/* Label Rendering */}
            {(!isCorridorNode || editorMode) && (
                <Text
                    text={node.label || nodeId}
                    x={-60}
                    y={-radius - 20}
                    width={120}
                    align="center"
                    fontSize={11}
                    fontStyle="600"
                    fontFamily="Inter, sans-serif"
                    fill="#FFFFFF"
                    opacity={isDimmed ? 0.4 : 1}
                    listening={false}
                    shadowColor="black"
                    shadowBlur={2}
                    shadowOpacity={0.8}
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
    isNavigating = false
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

    // Key Listeners
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

    // Animation State
    const [dashOffset, setDashOffset] = useState(0);

    useEffect(() => {
        let anim;
        if (path.length > 0) {
            const animate = () => {
                setDashOffset(prev => prev - 1); // Move dashes
                anim = requestAnimationFrame(animate);
            };
            anim = requestAnimationFrame(animate);

            // Auto-Zoom to Path Logic
            if (stageSize.width > 0 && path.length > 1) {
                const padding = 100;
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

                path.forEach(nodeId => {
                    const n = nodes[nodeId];
                    if (n) {
                        minX = Math.min(minX, n.x);
                        maxX = Math.max(maxX, n.x);
                        minY = Math.min(minY, n.y);
                        maxY = Math.max(maxY, n.y);
                    }
                });

                if (minX !== Infinity) {
                    const width = maxX - minX + padding * 2;
                    const height = maxY - minY + padding * 2;
                    const centerX = minX + (maxX - minX) / 2;
                    const centerY = minY + (maxY - minY) / 2;

                    // Calculate fitting scale
                    const fitScale = Math.min(
                        stageSize.width / width,
                        stageSize.height / height
                    );

                    // Clamp scale
                    const finalScale = Math.min(Math.max(fitScale, 0.4), 2.5);

                    // Calculate position to center
                    const finalX = stageSize.width / 2 - centerX * finalScale;
                    const finalY = stageSize.height / 2 - centerY * finalScale;

                    // Animate (Basic lerp or direct set for now)
                    // Using direct set for responsiveness
                    setScale(finalScale);
                    setPosition({ x: finalX, y: finalY });
                }
            }
        } else {
            setDashOffset(0);
            // Optional: meaningful default view reset could go here
        }
        return () => cancelAnimationFrame(anim);
    }, [path, stageSize, nodes, isNavigating]); // Include nodes to ensure coordinates are available

    // Render Helpers
    const renderedEdges = edges.map((edge, i) => {
        const [n1, n2] = edge;
        if (!nodes[n1] || !nodes[n2]) return null;
        const isPathEdge = path.some((id, idx) => idx < path.length - 1 && ((id === n1 && path[idx + 1] === n2) || (id === n2 && path[idx + 1] === n1)));

        let strokeColor = '#333333';
        let strokeWidth = 1.5;
        let opacity = 0.5;
        let dash = null;

        if (editorMode) { strokeColor = '#555555'; opacity = 0.7; }

        if (isPathEdge) {
            strokeColor = PALETTE.highlight;
            strokeWidth = 4;
            opacity = 1;
            dash = [10, 10]; // Dash pattern for flow effect
        }

        return (
            <Line
                key={i}
                points={[nodes[n1].x, nodes[n1].y, nodes[n2].x, nodes[n2].y]}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                opacity={opacity}
                lineCap="round"
                dash={isPathEdge ? dash : undefined}
                dashOffset={isPathEdge ? dashOffset : 0}
                onClick={() => editorMode && editorTool === 'delete' && setEdges(prev => prev.filter((_, idx) => idx !== i))}
            />
        );
    });

    const renderedGrid = showGrid ? <Group>{Array.from({ length: 40 }).map((_, i) => <Line key={`v${i}`} points={[i * 50, -1000, i * 50, 2000]} stroke="#1e293b" strokeWidth={1} />)}{Array.from({ length: 40 }).map((_, i) => <Line key={`h${i}`} points={[-1000, i * 50, 2000, i * 50]} stroke="#1e293b" strokeWidth={1} />)}</Group> : null;

    const handleNodeLeave = useCallback(() => {
        setHoveredNode(null);
    }, []);

    return (
        <div className={`floor-map-container ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>

            {/* Controls Header */}
            <div className="map-ui-header">
                <div className="ui-group">
                    <button onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>
                    <button onClick={() => setScale(s => Math.min(s * 1.2, 5))}><ZoomIn size={18} /></button>
                    <button onClick={() => setScale(s => Math.max(s / 1.2, 0.1))}><ZoomOut size={18} /></button>
                    <button onClick={() => { setScale(0.85); setPosition({ x: 0, y: 0 }); }}><RotateCcw size={18} /></button>
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
                </div>
            )}

            {/* Editor Properties Panel */}
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
            <Stage
                ref={stageRef} width={stageSize.width} height={stageSize.height}
                scaleX={scale} scaleY={scale} x={position.x} y={position.y}
                draggable={!isNavigating && (!editorMode || editorTool === 'select')}
                onWheel={!isNavigating ? handleWheel : undefined} onClick={handleStageClick}
                onMouseMove={(e) => { if (connectingFrom) { const pt = stageRef.current.getPointerPosition(); setTempLineEnd({ x: (pt.x - position.x) / scale, y: (pt.y - position.y) / scale }); } }}
                onDragEnd={(e) => { if (e.target === stageRef.current) setPosition({ x: e.target.x(), y: e.target.y() }); }}
            >
                <Layer listening={false}>
                    {/* Dark Background */}
                    <Rect width={2000} height={2000} fill="#050505" x={-500} y={-500} />
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
                    {connectingFrom && tempLineEnd && <Line points={[nodes[connectingFrom].x, nodes[connectingFrom].y, tempLineEnd.x, tempLineEnd.y]} stroke="#fbbf24" strokeWidth={2} dash={[5, 5]} />}
                    {Object.entries(nodes).map(([id, node]) => (
                        <MapNode key={id} nodeId={id} node={node}
                            isSelected={selectedNode === id} isHovered={hoveredNode === id}
                            isInPath={path.includes(id)} isStart={selectedStart?.id === id} isEnd={selectedEnd?.id === id}
                            isDimmed={path.length > 0 && !path.includes(id)}
                            editorMode={editorMode} isConnecting={connectingFrom === id}
                            onDrag={handleNodeDrag} onClick={handleNodeClick} onHover={setHoveredNode} onLeave={handleNodeLeave}
                        />
                    ))}
                </Layer>
            </Stage>

            {/* Colored Legend (Only outside Editor Mode) */}
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