import { useState, useEffect } from 'react';
import { useGraph } from '../context/GraphContext';
import {
  COLOR_PALETTE,
  FLOWCHART_SHAPES,
  MINDMAP_SHAPES,
  TIMELINE_SHAPES,
  BASIC_SHAPES,
  ARROW_SHAPES,
  CALLOUT_SHAPES,
  CONTAINER_SHAPES,
  ORGCHART_SHAPES,
  LOGIC_SHAPES,
  TEXT_SHAPES,
  FULL_PORTS_CONFIG
} from '../config/shapes';
import { COLOR_SCHEMES, getColorScheme } from '../config/colorSchemes';
import type { Node, Edge } from '@antv/x6';
import { setNodeLabelWithAutoSize, redistributeNodeText } from '../utils/text';
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Copy,
  Trash2,
  Group,
  Ungroup,
  Check,
  Clipboard,
  Maximize,
  Minimize
} from 'lucide-react';

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
const FONT_FAMILIES = [
  'System UI',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
];

export function PropertiesPanel() {
  const { selectedCell, graph, showGrid, setShowGrid, canvasBackground, setCanvasBackground, gridSize, setGridSize, exportGrid, setExportGrid, colorScheme, setColorScheme, spellcheckLanguage } = useGraph();
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

  // Node properties
  const [label, setLabel] = useState('');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('System UI');
  const [textColor, setTextColor] = useState('#333333');
  const [opacity, setOpacity] = useState(1);
  const [cornerRadius, setCornerRadius] = useState(6);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline'>('none');
  const [rotation, setRotation] = useState(0);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowBlur, setShadowBlur] = useState(8);
  const [shadowOffsetX, setShadowOffsetX] = useState(3);
  const [shadowOffsetY, setShadowOffsetY] = useState(3);
  const [shadowColor, setShadowColor] = useState('#00000040');
  const [nodeShape, setNodeShape] = useState<'rect' | 'ellipse' | 'none'>('rect');
  const [borderStyle, setBorderStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  // Image and decoration properties
  const [imageUrl, setImageUrl] = useState('');
  const [prefixDecoration, setPrefixDecoration] = useState('');
  const [suffixDecoration, setSuffixDecoration] = useState('');

  // Timeline properties
  const [timelineDate, setTimelineDate] = useState('');
  const [timelineEndDate, setTimelineEndDate] = useState('');
  const [timelineDescription, setTimelineDescription] = useState('');
  const [timelinePriority, setTimelinePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [timelineStatus, setTimelineStatus] = useState<'planned' | 'in-progress' | 'completed' | 'cancelled'>('planned');

  // Edge properties
  const [edgeColor, setEdgeColor] = useState('#5F95FF');
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [edgeConnector, setEdgeConnector] = useState<'normal' | 'rounded' | 'smooth' | 'ortho'>('normal');
  const [lineHops, setLineHops] = useState(false);
  const [sourceArrow, setSourceArrow] = useState<'block' | 'classic' | 'diamond' | 'circle' | 'circlePlus' | 'ellipse' | 'cross' | 'none'>('none');
  const [targetArrow, setTargetArrow] = useState<'block' | 'classic' | 'diamond' | 'circle' | 'circlePlus' | 'ellipse' | 'cross' | 'none'>('none');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeLabelBg, setEdgeLabelBg] = useState('#ffffff');
  const [edgeLabelColor, setEdgeLabelColor] = useState('#000000');
  const [edgeLabelBorderColor, setEdgeLabelBorderColor] = useState('#dddddd');
  const [showEdgeLabelBorder, setShowEdgeLabelBorder] = useState(false);

  // Clipboard State
  const [clipboardSize, setClipboardSize] = useState<{ width: number; height: number } | null>(null);
  const [clipboardStyle, setClipboardStyle] = useState<any | null>(null);

  // Computed properties
  const isNode = selectedCell?.isNode();
  const activeEdge = selectedCell?.isEdge?.() ? (selectedCell as Edge) : selectedEdges[0] ?? null;
  const isEdge = !!activeEdge;
  const getEdgeTargets = () => (selectedEdges.length ? selectedEdges : activeEdge ? [activeEdge] : []);

  // Track multiple selected nodes
  useEffect(() => {
    if (!graph) {
      setSelectedNodes([]);
      setSelectedEdges([]);
      return;
    }

    const updateSelection = () => {
      const cells = graph.getSelectedCells();
      const nodes = cells.filter(c => c.isNode()) as Node[];
      const edges = cells.filter(c => c.isEdge()) as Edge[];
      setSelectedNodes(nodes);
      setSelectedEdges(edges);
    };

    updateSelection();
    graph.on('selection:changed', updateSelection);

    return () => {
      graph.off('selection:changed', updateSelection);
    };
  }, [graph, selectedCell]);

  // Redistribute text when node is resized
  useEffect(() => {
    if (!graph) return;

    const handleNodeResized = ({ node }: { node: Node }) => {
      redistributeNodeText(node);
    };

    graph.on('node:resized', handleNodeResized);

    return () => {
      graph.off('node:resized', handleNodeResized);
    };
  }, [graph]);

  // ========== Alignment Functions ==========
  const handleAlignLeft = () => {
    if (!graph || selectedNodes.length < 2) return;
    const minX = Math.min(...selectedNodes.map(n => n.getBBox().x));
    selectedNodes.forEach(n => n.setPosition(minX, n.getBBox().y));
  };

  const handleAlignCenterH = () => {
    if (!graph || selectedNodes.length < 2) return;
    const boxes = selectedNodes.map(n => n.getBBox());
    const avgX = boxes.reduce((sum, b) => sum + b.x + b.width / 2, 0) / boxes.length;
    selectedNodes.forEach((n, i) => n.setPosition(avgX - boxes[i].width / 2, boxes[i].y));
  };

  const handleAlignRight = () => {
    if (!graph || selectedNodes.length < 2) return;
    const maxX = Math.max(...selectedNodes.map(n => n.getBBox().x + n.getBBox().width));
    selectedNodes.forEach(n => n.setPosition(maxX - n.getBBox().width, n.getBBox().y));
  };

  const handleAlignTop = () => {
    if (!graph || selectedNodes.length < 2) return;
    const minY = Math.min(...selectedNodes.map(n => n.getBBox().y));
    selectedNodes.forEach(n => n.setPosition(n.getBBox().x, minY));
  };

  const handleAlignCenterV = () => {
    if (!graph || selectedNodes.length < 2) return;
    const boxes = selectedNodes.map(n => n.getBBox());
    const avgY = boxes.reduce((sum, b) => sum + b.y + b.height / 2, 0) / boxes.length;
    selectedNodes.forEach((n, i) => n.setPosition(boxes[i].x, avgY - boxes[i].height / 2));
  };

  const handleAlignBottom = () => {
    if (!graph || selectedNodes.length < 2) return;
    const maxY = Math.max(...selectedNodes.map(n => n.getBBox().y + n.getBBox().height));
    selectedNodes.forEach(n => n.setPosition(n.getBBox().x, maxY - n.getBBox().height));
  };

  const handleDistributeH = () => {
    if (!graph || selectedNodes.length < 3) return;
    const sorted = [...selectedNodes].sort((a, b) => a.getBBox().x - b.getBBox().x);
    const first = sorted[0].getBBox();
    const last = sorted[sorted.length - 1].getBBox();
    const totalWidth = last.x + last.width - first.x;
    const totalNodeWidth = sorted.reduce((sum, n) => sum + n.getBBox().width, 0);
    const gap = (totalWidth - totalNodeWidth) / (sorted.length - 1);
    let currentX = first.x;
    sorted.forEach(n => {
      const box = n.getBBox();
      n.setPosition(currentX, box.y);
      currentX += box.width + gap;
    });
  };

  const handleDistributeV = () => {
    if (!graph || selectedNodes.length < 3) return;
    const sorted = [...selectedNodes].sort((a, b) => a.getBBox().y - b.getBBox().y);
    const first = sorted[0].getBBox();
    const last = sorted[sorted.length - 1].getBBox();
    const totalHeight = last.y + last.height - first.y;
    const totalNodeHeight = sorted.reduce((sum, n) => sum + n.getBBox().height, 0);
    const gap = (totalHeight - totalNodeHeight) / (sorted.length - 1);
    let currentY = first.y;
    sorted.forEach(n => {
      const box = n.getBBox();
      n.setPosition(box.x, currentY);
      currentY += box.height + gap;
    });
  };

  const handleGroupSelected = () => {
    if (!graph || selectedNodes.length < 2) return;
    const boxes = selectedNodes.map(n => n.getBBox());
    const minX = Math.min(...boxes.map(b => b.x)) - 10;
    const minY = Math.min(...boxes.map(b => b.y)) - 10;
    const maxX = Math.max(...boxes.map(b => b.x + b.width)) + 10;
    const maxY = Math.max(...boxes.map(b => b.y + b.height)) + 10;

    const group = graph.createNode({
      x: minX, y: minY,
      width: maxX - minX, height: maxY - minY,
      shape: 'rect',
      attrs: {
        body: { fill: 'rgba(95, 149, 255, 0.05)', stroke: '#5F95FF', strokeWidth: 1, strokeDasharray: '5 5', rx: 4, ry: 4 },
      },
      zIndex: 0,
    });
    graph.addCell(group);
    selectedNodes.forEach(n => group.addChild(n));
    graph.cleanSelection();
    graph.select(group);
  };

  const handleUngroupSelected = () => {
    if (!graph) return;
    selectedNodes.forEach(node => {
      const children = node.getChildren();
      if (children && children.length > 0) {
        children.forEach(child => {
          node.removeChild(child);
          graph.addCell(child);
        });
        // Use setTimeout to avoid React unmount race condition
        setTimeout(() => {
          graph.removeCell(node);
        }, 0);
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!graph) return;
    // Use setTimeout to avoid React unmount race condition
    setTimeout(() => {
      // Get current selection directly from graph to avoid stale React state
      const currentSelection = graph.getSelectedCells();
      if (currentSelection.length > 0) {
        graph.removeCells(currentSelection);
      } else {
        // Fallback to React state if graph selection is empty
        const cellsToRemove = [...selectedNodes, ...selectedEdges];
        graph.removeCells(cellsToRemove);
      }
    }, 0);
  };

  const handleCopySize = () => {
    if (selectedCell && isNode) {
      const { width, height } = (selectedCell as Node).getSize();
      setClipboardSize({ width, height });
    } else if (selectedNodes.length > 0) {
      const { width, height } = selectedNodes[selectedNodes.length - 1].getSize();
      setClipboardSize({ width, height });
    }
  };

  const handlePasteSize = () => {
    if (clipboardSize) {
      const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
      targets.forEach(node => {
        // Apply logic to preserve width if needed? No, user explicitly requested Paste Size.
        // So we override size.
        node.resize(clipboardSize.width, clipboardSize.height);
      });
    }
  };

  const handleCopyStyle = () => {
    const target = selectedNodes.length > 0 ? selectedNodes[selectedNodes.length - 1] : selectedCell;
    if (target) {
      setClipboardStyle(target.getAttrs());
    }
  };

  const handlePasteStyle = () => {
    if (clipboardStyle) {
      const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
      const edges = selectedEdges.length > 0 ? selectedEdges : (selectedCell && !isNode ? [selectedCell as Edge] : []);

      const allTargets = [...targets, ...edges];

      allTargets.forEach(cell => {
        // Node -> Node
        if (cell.isNode()) {
          if (clipboardStyle.body) cell.setAttrs({ body: clipboardStyle.body });
          if (clipboardStyle.label) {
            // Preserve text property
            const currentText = cell.getAttrByPath('label/text');
            // Also preserve textWrap if not in style?
            const { text, textWrap, ...style } = clipboardStyle.label;
            // Apply style but ensure text is kept (if we passed text in style it would overwrite)
            // setAttrs merges? explicit label object replacement might remove text.
            // We should merge.
            cell.setAttrs({
              label: {
                ...style,
                text: currentText // Ensure text is preserved (or restored if style had text)
              }
            });
          }
        }
        // Edge -> Edge
        if (cell.isEdge()) {
          if (clipboardStyle.line) cell.setAttrs({ line: clipboardStyle.line });
        }
      });
    }
  };

  const handleDuplicateSelected = () => {
    if (!graph || selectedNodes.length === 0) return;
    graph.copy(selectedNodes);
    const cloned = graph.paste({ offset: 30 });
    graph.cleanSelection();
    graph.select(cloned);
  };

  useEffect(() => {
    if (selectedCell && selectedCell.isNode()) {
      const node = selectedCell as Node;
      const attrs = node.getAttrs();

      setLabel((attrs.label?.text as string) || '');
      setFillColor((attrs.body?.fill as string) || '#ffffff');
      setStrokeColor((attrs.body?.stroke as string) || '#333333');
      setStrokeWidth((attrs.body?.strokeWidth as number) || 2);
      setFontSize((attrs.label?.fontSize as number) || 14);
      setTextColor((attrs.label?.fill as string) || '#333333');
      setOpacity(node.getAttrByPath('body/opacity') as number ?? 1);
      setCornerRadius((attrs.body?.rx as number) || 0);
      // Read border style from strokeDasharray
      const bodyDashArray = attrs.body?.strokeDasharray as string;
      if (bodyDashArray?.includes('8 4') || bodyDashArray?.includes('8,4')) setBorderStyle('dashed');
      else if (bodyDashArray?.includes('2 2') || bodyDashArray?.includes('2,2') || bodyDashArray?.includes('3 3') || bodyDashArray?.includes('3,3')) setBorderStyle('dotted');
      else setBorderStyle('solid');
      setTextAlign((attrs.label?.textAnchor as 'left' | 'center' | 'right') || 'center');
      setFontWeight((attrs.label?.fontWeight as 'normal' | 'bold') || 'normal');
      setFontStyle((attrs.label?.fontStyle as 'normal' | 'italic') || 'normal');
      setTextDecoration((attrs.label?.textDecoration as 'none' | 'underline') || 'none');
      setRotation(node.getAngle() || 0);
      const body = attrs.body || {};
      const shape = (node as Node).shape;
      if (shape === 'ellipse') {
        setNodeShape('ellipse');
      } else if (body.fill === 'transparent' && (body.strokeWidth === 0 || body.stroke === 'transparent')) {
        setNodeShape('none');
      } else {
        setNodeShape('rect');
      }

      // Load image and decoration data
      setImageUrl((attrs.image?.xlinkHref as string) || '');
      const data = node.getData() || {};
      setPrefixDecoration((data.prefixDecoration as string) || '');
      setSuffixDecoration((data.suffixDecoration as string) || '');

      // Load timeline data if it's a timeline node
      if (data.isTimeline) {
        setTimelineDate((data.date as string) || '');
        setTimelineEndDate((data.endDate as string) || '');
        setTimelineDescription((data.description as string) || '');
        setTimelinePriority((data.priority as any) || 'medium');
        setTimelineStatus((data.status as any) || 'planned');
      } else {
        // Reset timeline fields for non-timeline nodes
        setTimelineDate('');
        setTimelineEndDate('');
        setTimelineDescription('');
        setTimelinePriority('medium');
        setTimelineStatus('planned');
      }
    } else if (activeEdge) {
      const edge = activeEdge as Edge;
      const attrs = edge.getAttrs();
      const lineAttrs = (attrs.line || {}) as Record<string, any>;
      setEdgeLabel((edge.getLabels()[0]?.attrs?.text?.text as string) || '');
      setEdgeLabelBg((edge.getLabels()[0]?.attrs?.rect?.fill as string) || '#ffffff');
      setEdgeLabelColor((edge.getLabels()[0]?.attrs?.text?.fill as string) || '#000000');

      const rectStroke = (edge.getLabels()[0]?.attrs?.rect?.stroke as string);
      const rectStrokeWidth = (edge.getLabels()[0]?.attrs?.rect?.strokeWidth as number);
      setEdgeLabelBorderColor(rectStroke || '#dddddd');
      setShowEdgeLabelBorder(rectStrokeWidth > 0);

      setEdgeColor((attrs.line?.stroke as string) || '#5F95FF');
      setEdgeWidth((attrs.line?.strokeWidth as number) || 2);
      const dashArray = attrs.line?.strokeDasharray as string;
      if (dashArray?.includes('8 4')) setEdgeStyle('dashed');
      else if (dashArray?.includes('2 2')) setEdgeStyle('dotted');
      else setEdgeStyle('solid');

      const connector = (edge.getConnector() as any)?.name || 'normal';
      const router = (edge.getRouter() as any)?.name;

      if (connector === 'smooth') setEdgeConnector('smooth');
      else if (connector === 'rounded' && router !== 'manhattan') setEdgeConnector('rounded');
      else if (router === 'manhattan') setEdgeConnector('ortho');
      else setEdgeConnector('normal');

      const currentSourceMarker = lineAttrs.sourceMarker?.name || 'none';
      const currentTargetMarker = lineAttrs.targetMarker?.name || 'none';
      setSourceArrow(currentSourceMarker as typeof sourceArrow);
      setTargetArrow(currentTargetMarker as typeof targetArrow);
    }
  }, [selectedCell, activeEdge]);

  // Listen for shape change event from context menu
  const [showShapeDialog, setShowShapeDialog] = useState(false);
  const [shapeChangeTarget, setShapeChangeTarget] = useState<Node | null>(null);

  useEffect(() => {
    const handleChangeShape = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { cell } = customEvent.detail;
      if (cell && cell.isNode?.()) {
        setShapeChangeTarget(cell);
        setShowShapeDialog(true);
      }
    };

    window.addEventListener('drawdd:change-shape', handleChangeShape);
    return () => window.removeEventListener('drawdd:change-shape', handleChangeShape);
  }, []);

  const handleReplaceShape = (shapeLabel: string) => {
    if (!graph || !shapeChangeTarget) return;

    // Use batch/history to make this a single undo-able operation
    graph.startBatch('replace-shape');

    try {
      const oldNode = shapeChangeTarget;
      const oldPos = oldNode.getPosition();
      const oldAttrs = oldNode.getAttrs();
      const oldData = oldNode.getData();

      const allShapes = [
        ...FLOWCHART_SHAPES,
        ...MINDMAP_SHAPES,
        ...TIMELINE_SHAPES,
        ...BASIC_SHAPES,
        ...ARROW_SHAPES,
        ...CALLOUT_SHAPES,
        ...CONTAINER_SHAPES,
        ...ORGCHART_SHAPES,
        ...LOGIC_SHAPES,
        ...TEXT_SHAPES
      ];

      // Find by label to ensure unique identification (many shapes share the same type like 'polygon')
      const shapeConfig = allShapes.find(s => s.label === shapeLabel);
      if (!shapeConfig) return;

      // Get connected edges with their original port info
      const incomingEdges = graph.getIncomingEdges(oldNode);
      const outgoingEdges = graph.getOutgoingEdges(oldNode);

      // Create new node with same position and text
      // Always use FULL_PORTS_CONFIG to ensure all ports are available for edge repositioning
      const newNode = graph.addNode({
        ...shapeConfig,
        shape: shapeConfig.type,
        x: oldPos.x,
        y: oldPos.y,
        attrs: {
          ...shapeConfig.attrs,
          label: {
            ...(shapeConfig.attrs.label as any),
            text: oldAttrs.label?.text || shapeConfig.attrs.label.text,
          },
        } as any,
        data: oldData,
        ports: FULL_PORTS_CONFIG as any,
      });

      // Reconnect edges to the new node at best matching ports
      // Map old connection points to appropriate ports on new shape
      incomingEdges?.forEach(edge => {
        const oldTarget = edge.getTarget() as any;
        const oldPort = oldTarget?.port;
        // Try to keep same port if it exists, otherwise use 'left' as default for incoming
        const portToUse = oldPort && FULL_PORTS_CONFIG.items.some(p => p.id === oldPort) ? oldPort : 'left';
        edge.setTarget({ cell: newNode.id, port: portToUse });
      });
      outgoingEdges?.forEach(edge => {
        const oldSource = edge.getSource() as any;
        const oldPort = oldSource?.port;
        // Try to keep same port if it exists, otherwise use 'right' as default for outgoing
        const portToUse = oldPort && FULL_PORTS_CONFIG.items.some(p => p.id === oldPort) ? oldPort : 'right';
        edge.setSource({ cell: newNode.id, port: portToUse });
      });

      // Remove old node and select new one
      // Use setTimeout to avoid React unmount race condition
      setTimeout(() => {
        graph.removeNode(oldNode);
        graph.select(newNode);
      }, 0);
    } finally {
      graph.stopBatch('replace-shape');
    }

    setShowShapeDialog(false);
    setShapeChangeTarget(null);
  };

  const handleLabelChange = (value: string) => {
    setLabel(value);
    if (selectedCell && isNode) {
      setNodeLabelWithAutoSize(selectedCell as Node, value);
    }
  };

  const handleFillColorChange = (color: string) => {
    setFillColor(color);
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ body: { fill: color } });
    });
  };

  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ body: { stroke: color } });
    });
  };

  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width);
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ body: { strokeWidth: width } });
    });
  };

  const handleBorderStyleChange = (style: 'solid' | 'dashed' | 'dotted') => {
    setBorderStyle(style);
    const dashArray = style === 'dashed' ? '8 4' : style === 'dotted' ? '2 2' : '';
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ body: { strokeDasharray: dashArray || undefined } });
    });
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ label: { fontSize: size } });
    });
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    if (selectedCell && isNode) {
      const fontValue = family === 'System UI' ? 'system-ui, sans-serif' : family;
      (selectedCell as Node).setAttrs({ label: { fontFamily: fontValue } });
    }
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ label: { fill: color } });
    });
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ body: { opacity: value } });
    });
  };

  const handleCornerRadiusChange = (value: number) => {
    setCornerRadius(value);
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      node.setAttrs({ body: { rx: value, ry: value } });
    });
  };

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    setTextAlign(align);
    if (selectedCell && isNode) {
      const textAnchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
      const refX = align === 'left' ? 0.1 : align === 'right' ? 0.9 : 0.5;
      (selectedCell as Node).setAttrs({
        label: {
          textAnchor,
          refX,
        }
      });
    }
  };

  const handleFontWeightChange = (weight: 'normal' | 'bold') => {
    setFontWeight(weight);
    if (selectedCell && isNode) {
      (selectedCell as Node).setAttrs({ label: { fontWeight: weight } });
    }
  };

  const handleFontStyleChange = (style: 'normal' | 'italic') => {
    setFontStyle(style);
    if (selectedCell && isNode) {
      (selectedCell as Node).setAttrs({ label: { fontStyle: style } });
    }
  };

  const handleTextDecorationChange = (decoration: 'none' | 'underline') => {
    setTextDecoration(decoration);
    if (selectedCell && isNode) {
      (selectedCell as Node).setAttrs({ label: { textDecoration: decoration } });
    }
  };

  const handleRotationChange = (angle: number) => {
    setRotation(angle);
    if (selectedCell && isNode) {
      (selectedCell as Node).rotate(angle, { absolute: true });
    }
  };

  const handleShadowToggle = (enabled: boolean) => {
    setShadowEnabled(enabled);
    if (selectedCell && isNode) {
      if (enabled) {
        (selectedCell as Node).setAttrs({
          body: {
            filter: {
              name: 'dropShadow',
              args: {
                dx: shadowOffsetX,
                dy: shadowOffsetY,
                blur: shadowBlur,
                color: shadowColor,
              },
            },
          }
        });
      } else {
        (selectedCell as Node).setAttrs({ body: { filter: null } });
      }
    }
  };

  const handleShadowChange = (blur: number, offsetX: number, offsetY: number, color: string) => {
    setShadowBlur(blur);
    setShadowOffsetX(offsetX);
    setShadowOffsetY(offsetY);
    setShadowColor(color);
    if (selectedCell && isNode && shadowEnabled) {
      (selectedCell as Node).setAttrs({
        body: {
          filter: {
            name: 'dropShadow',
            args: {
              dx: offsetX,
              dy: offsetY,
              blur: blur,
              color: color,
            },
          },
        }
      });
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      const imgEl = new Image();
      imgEl.onload = () => {
        const maxDim = 320;
        const minDim = 60;
        const scale = Math.min(maxDim / imgEl.width, maxDim / imgEl.height, 1);
        const width = Math.max(minDim, Math.round(imgEl.width * scale));
        const height = Math.max(minDim, Math.round(imgEl.height * scale));

        node.resize(width, height);
        node.setAttrs({
          image: {
            xlinkHref: url,
            width,
            height,
            preserveAspectRatio: 'xMidYMid meet',
          }
        });
        // Save URL to node data so it persists on save/load
        node.setData({ ...node.getData(), imageUrl: url, naturalWidth: imgEl.width, naturalHeight: imgEl.height });
      };
      imgEl.src = url;
    }
  };

  const handlePrefixDecorationChange = (decoration: string) => {
    setPrefixDecoration(decoration);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      node.setData({ ...node.getData(), prefixDecoration: decoration });

      // Update label to show decoration
      const currentLabel = node.getAttrs().label?.text as string || '';
      const baseLabel = currentLabel.replace(/^[\u{1F300}-\u{1F9FF}]+ /u, '').replace(/^[🔢#@★⭐🚩🏳️🏴🏁⚑]+\s*/g, '');
      const newLabel = decoration ? `${decoration} ${baseLabel}` : baseLabel;
      node.setAttrs({ label: { text: newLabel } });
      setLabel(newLabel);
    }
  };

  const handleSuffixDecorationChange = (decoration: string) => {
    setSuffixDecoration(decoration);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      node.setData({ ...node.getData(), suffixDecoration: decoration });

      // Update label to show decoration
      const currentLabel = node.getAttrs().label?.text as string || '';
      const baseLabel = currentLabel.replace(/ [\u{1F300}-\u{1F9FF}]+$/u, '').replace(/\s*[🔢#@★⭐🚩🏳️🏴🏁⚑]+$/g, '');
      const newLabel = decoration ? `${baseLabel} ${decoration}` : baseLabel;
      node.setAttrs({ label: { text: newLabel } });
      setLabel(newLabel);
    }
  };

  const applyNodeShape = (shape: 'rect' | 'ellipse' | 'none') => {
    if (!graph) return;
    const targets = selectedNodes.length > 0 ? selectedNodes : (selectedCell && isNode ? [selectedCell as Node] : []);
    targets.forEach(node => {
      if (shape === 'none') {
        node.setProp('shape', 'rect');
        node.setAttrs({ body: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0, rx: 0, ry: 0 } });
      } else if (shape === 'ellipse') {
        const size = node.getSize();
        const r = Math.max(size.width, size.height) / 2;
        node.setProp('shape', 'ellipse');
        node.setAttrs({ body: { rx: r, ry: r, fill: fillColor, stroke: strokeColor, strokeWidth } });
      } else {
        node.setProp('shape', 'rect');
        node.setAttrs({ body: { rx: cornerRadius, ry: cornerRadius, fill: fillColor, stroke: strokeColor, strokeWidth } });
      }
    });
    setNodeShape(shape);
  };

  // Timeline property handlers
  const handleTimelineDateChange = (date: string) => {
    setTimelineDate(date);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      const data = node.getData() || {};
      node.setData({ ...data, date });

      // Trigger timeline re-layout if in timeline mode
      if (graph && (window as any).__drawdd_mode === 'timeline') {
        setTimeout(() => {
          const { applyTimelineLayout } = require('../utils/layout');
          const direction = (window as any).__timelineDirection || 'horizontal';
          applyTimelineLayout(graph, direction, { sortByDate: true, showDateLabels: true });
        }, 100);
      }
    }
  };

  const handleTimelineEndDateChange = (endDate: string) => {
    setTimelineEndDate(endDate);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      const data = node.getData() || {};
      node.setData({ ...data, endDate });
    }
  };

  const handleTimelineDescriptionChange = (description: string) => {
    setTimelineDescription(description);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      const data = node.getData() || {};
      node.setData({ ...data, description });
    }
  };

  const handleTimelinePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    setTimelinePriority(priority);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      const data = node.getData() || {};
      node.setData({ ...data, priority });

      // Update node color based on priority
      const priorityColors = {
        low: { fill: '#e0f2fe', stroke: '#0284c7' },
        medium: { fill: '#fef3c7', stroke: '#f59e0b' },
        high: { fill: '#fee2e2', stroke: '#dc2626' }
      };
      const colors = priorityColors[priority];
      node.setAttrs({
        body: {
          ...node.getAttrs().body,
          fill: colors.fill,
          stroke: colors.stroke
        }
      });
    }
  };

  const handleTimelineStatusChange = (status: 'planned' | 'in-progress' | 'completed' | 'cancelled') => {
    setTimelineStatus(status);
    if (selectedCell && isNode) {
      const node = selectedCell as Node;
      const data = node.getData() || {};
      node.setData({ ...data, status });

      // Update node opacity based on status
      const statusOpacity = {
        planned: 0.7,
        'in-progress': 1.0,
        completed: 0.5,
        cancelled: 0.3
      };
      node.setAttrs({
        body: {
          ...node.getAttrs().body,
          opacity: statusOpacity[status]
        }
      });
    }
  };

  const handleEdgeColorChange = (color: string) => {
    setEdgeColor(color);
    getEdgeTargets().forEach(edge => {
      edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), stroke: color } });
    });
  };

  const handleEdgeWidthChange = (width: number) => {
    setEdgeWidth(width);
    getEdgeTargets().forEach(edge => {
      edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), strokeWidth: width } });
    });
  };

  const handleApplyEdgesToAll = () => {
    if (!graph) return;
    const dashArray = edgeStyle === 'dashed' ? '8 4' : edgeStyle === 'dotted' ? '2 2' : '';

    // Always use the user's arrow selection - this is an explicit "Apply to All" action
    const sourceMarker = sourceArrow === 'none' ? '' : { name: sourceArrow, width: 12, height: 8 };
    const targetMarker = targetArrow === 'none' ? '' : { name: targetArrow, width: 12, height: 8 };

    graph.getEdges().forEach(edge => {
      // Stroke/width/style/arrows
      edge.setAttrs({
        line: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          strokeDasharray: dashArray || undefined,
          sourceMarker,
          targetMarker,
        },
      });

      // Connector / router - must match handleEdgeConnectorChange logic
      if (edgeConnector === 'smooth') {
        edge.setConnector('smooth');
        edge.setRouter('normal');
      } else if (edgeConnector === 'rounded') {
        // Rounded = orthogonal with rounded corners (manhattan router)
        edge.setConnector({ name: 'rounded', args: { radius: 10 } });
        edge.setRouter('manhattan');
      } else if (edgeConnector === 'ortho') {
        // Orthogonal = sharp 90° corners (manhattan router)
        edge.setConnector('normal');
        edge.setRouter('manhattan');
      } else {
        // Straight = direct line
        edge.setConnector('normal');
        edge.setRouter('normal');
      }
    });
  };

  const handleSelectAllEdges = () => {
    if (!graph) return;
    const edges = graph.getEdges();
    if (edges.length === 0) return;
    graph.cleanSelection();
    graph.select(edges);
  };

  const handleEdgeStyleChange = (style: 'solid' | 'dashed' | 'dotted') => {
    setEdgeStyle(style);
    const dashArray = style === 'dashed' ? '8 4' : style === 'dotted' ? '2 2' : '';
    getEdgeTargets().forEach(edge => {
      edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), strokeDasharray: dashArray || undefined } });
    });
  };

  const handleEdgeConnectorChange = (type: 'normal' | 'rounded' | 'smooth' | 'ortho') => {
    setEdgeConnector(type);
    // v1.1.2 original logic restored
    getEdgeTargets().forEach(edge => {
      if (type === 'smooth') {
        edge.setConnector('smooth');
        edge.setRouter('normal');
      } else if (type === 'rounded') {
        // Rounded = orthogonal with rounded corners to be distinct from Straight
        edge.setConnector({ name: 'rounded', args: { radius: 10 } });
        edge.setRouter('manhattan');
      } else if (type === 'ortho') {
        // Orthogonal = sharp 90° corners for better alignment
        edge.setConnector('normal');
        edge.setRouter('manhattan');
      } else {
        edge.setConnector('normal');
        edge.setRouter('normal');
      }
      // Re-apply line hops if enabled
      if (lineHops) {
        edge.setConnector({ name: 'jumpover', args: { size: 6, type: 'arc' } });
      }
    });
  };

  const handleLineHopsChange = (enabled: boolean) => {
    setLineHops(enabled);
    getEdgeTargets().forEach(edge => {
      if (enabled) {
        // Apply jumpover connector
        edge.setConnector({ name: 'jumpover', args: { size: 6, type: 'arc' } });
      } else {
        // Restore based on current connector type
        if (edgeConnector === 'smooth') {
          edge.setConnector('smooth');
        } else if (edgeConnector === 'rounded') {
          edge.setConnector({ name: 'rounded', args: { radius: 10 } });
        } else {
          edge.setConnector('normal');
        }
      }
    });
  };

  const handleSourceArrowChange = (type: 'block' | 'classic' | 'diamond' | 'circle' | 'circlePlus' | 'ellipse' | 'cross' | 'none') => {
    setSourceArrow(type);
    getEdgeTargets().forEach(edge => {
      if (type === 'none') {
        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), sourceMarker: '' } });
      } else {
        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), sourceMarker: { name: type, width: 12, height: 8 } } });
      }
    });
  };

  const handleTargetArrowChange = (type: 'block' | 'classic' | 'diamond' | 'circle' | 'circlePlus' | 'ellipse' | 'cross' | 'none') => {
    setTargetArrow(type);
    getEdgeTargets().forEach(edge => {
      if (type === 'none') {
        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), targetMarker: '' } });
      } else {
        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), targetMarker: { name: type, width: 12, height: 8 } } });
      }
    });
  };

  const handleEdgeLabelChange = (value: string) => {
    setEdgeLabel(value);
    getEdgeTargets().forEach(edge => {
      if (value) {
        // Preserve existing label attributes if possible
        const existingLabel = edge.getLabels()[0];
        if (existingLabel) {
          edge.setLabelAt(0, {
            ...existingLabel,
            attrs: {
              ...existingLabel.attrs,
              text: { ...existingLabel.attrs?.text, text: value },
            }
          });
        } else {
          // Defaults: Black text, White background, No border (strokeWidth: 0)
          edge.setLabels([{
            attrs: {
              text: { text: value, fill: edgeLabelColor, fontSize: 12 },
              rect: {
                fill: edgeLabelBg,
                stroke: edgeLabelBorderColor,
                strokeWidth: showEdgeLabelBorder ? 1 : 0,
                ref: 'text', refWidth: '140%', refHeight: '140%', refX: '-20%', refY: '-20%', rx: 4, ry: 4
              },
            },
            position: 0.5,
          }]);
        }
      } else {
        edge.setLabels([]);
      }
    });
  };

  const handleEdgeLabelBgChange = (color: string) => {
    setEdgeLabelBg(color);
    getEdgeTargets().forEach(edge => {
      const existingLabel = edge.getLabels()[0];
      if (existingLabel) {
        edge.setLabelAt(0, {
          ...existingLabel,
          attrs: {
            ...existingLabel.attrs,
            rect: { ...existingLabel.attrs?.rect, fill: color }
          }
        });
      }
    });
  };

  const handleEdgeLabelColorChange = (color: string) => {
    setEdgeLabelColor(color);
    getEdgeTargets().forEach(edge => {
      const existingLabel = edge.getLabels()[0];
      if (existingLabel) {
        edge.setLabelAt(0, {
          ...existingLabel,
          attrs: {
            ...existingLabel.attrs,
            text: { ...existingLabel.attrs?.text, fill: color }
          }
        });
      }
    });
  };

  const handleEdgeLabelBorderColorChange = (color: string) => {
    setEdgeLabelBorderColor(color);
    getEdgeTargets().forEach(edge => {
      const existingLabel = edge.getLabels()[0];
      if (existingLabel) {
        edge.setLabelAt(0, {
          ...existingLabel,
          attrs: {
            ...existingLabel.attrs,
            rect: { ...existingLabel.attrs?.rect, stroke: color }
          }
        });
      }
    });
  };

  const handleEdgeLabelBorderVisibilityChange = (visible: boolean) => {
    setShowEdgeLabelBorder(visible);
    getEdgeTargets().forEach(edge => {
      const existingLabel = edge.getLabels()[0];
      if (existingLabel) {
        edge.setLabelAt(0, {
          ...existingLabel,
          attrs: {
            ...existingLabel.attrs,
            rect: { ...existingLabel.attrs?.rect, strokeWidth: visible ? 1 : 0 }
          }
        });
      }
    });
  };

  // Show Canvas Properties only when nothing is selected
  if (!selectedCell && selectedNodes.length === 0 && selectedEdges.length === 0) {
    const handleBackgroundColorChange = (color: string) => {
      setCanvasBackground({ type: 'color', color });
      if (graph) {
        graph.drawBackground({ color });
      }
    };

    const handleGridToggle = () => {
      const newShowGrid = !showGrid;
      setShowGrid(newShowGrid);
      if (graph) {
        if (newShowGrid) {
          graph.drawGrid({
            type: 'doubleMesh',
            args: [
              {
                color: '#e2e8f0',
                thickness: 1,
              },
              {
                color: '#cbd5e1',
                thickness: 1,
                factor: 4,
              },
            ],
          });
        } else {
          graph.clearGrid();
        }
      }
    };

    const handleApplyColorScheme = (schemeId: string) => {
      setColorScheme(schemeId);
      const scheme = getColorScheme(schemeId);

      // Apply to canvas background
      setCanvasBackground({ type: 'color', color: scheme.backgroundColor });
      if (graph) {
        graph.drawBackground({ color: scheme.backgroundColor });

        // Apply to existing nodes
        const nodes = graph.getNodes();
        nodes.forEach((node, index) => {
          // Skip text boxes (transparent body)
          const attrs = node.getAttrs();
          if (attrs.body?.fill === 'transparent' && attrs.body?.stroke === 'transparent') {
            return;
          }

          const colorType = index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'secondary' : 'accent';
          const colors = scheme.nodeColors[colorType];
          node.setAttrs({
            body: { fill: colors.fill, stroke: colors.stroke },
            label: { fill: colors.text }
          });
        });

        // Apply to edges
        const edges = graph.getEdges();
        edges.forEach((edge) => {
          edge.setAttrs({
            line: { stroke: scheme.lineColor }
          });
        });
      }
    };

    return (
      <div className="w-72 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            🖼️ Canvas Properties
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <Section title="Background Color">
            <ColorRow
              color={canvasBackground.type === 'color' ? canvasBackground.color : '#f8fafc'}
              onChange={handleBackgroundColorChange}
            />
            <ColorPalette
              selectedColor={canvasBackground.type === 'color' ? canvasBackground.color : '#f8fafc'}
              onColorSelect={handleBackgroundColorChange}
            />
          </Section>

          <Section title="Grid">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Grid</span>
              <button
                onClick={handleGridToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showGrid ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showGrid ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Grid Size</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={gridSize ?? 10}
                  onChange={(e) => setGridSize?.(Math.max(5, Math.min(100, Number(e.target.value) || 10)))}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">px</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Export Grid</span>
              <button
                onClick={() => setExportGrid?.(!exportGrid)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exportGrid ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${exportGrid ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </Section>

          <Section title="Color Scheme">
            <div className="grid grid-cols-2 gap-2">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => handleApplyColorScheme(scheme.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left ${colorScheme === scheme.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex gap-0.5">
                    {scheme.preview.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="flex-1 text-xs font-medium text-gray-900 dark:text-white truncate">
                    {scheme.name}
                  </span>
                  {colorScheme === scheme.id && (
                    <Check size={12} className="text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center text-xs text-gray-400 dark:text-gray-500">
              💡 Click any shape or connection to edit its properties
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple Selected Nodes
  if (selectedNodes.length > 1) {
    const handleMatchSize = (type: 'width' | 'height' | 'both') => {
      if (!graph || selectedNodes.length < 2) return;
      const primary = selectedNodes[selectedNodes.length - 1];
      const size = primary.getSize();

      selectedNodes.forEach(node => {
        if (node.id === primary.id) return;
        const current = node.getSize();
        node.resize(
          type === 'height' ? current.width : size.width,
          type === 'width' ? current.height : size.height
        );
      });
    };

    const totalItems = selectedNodes.length + selectedEdges.length;

    return (
      <div className="w-72 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden border-l border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
              <Check size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                {totalItems} Items Selected
              </h2>
              {selectedEdges.length > 0 && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {selectedNodes.length} shapes, {selectedEdges.length} connections
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Selected Items List */}
          <Section title={`Selected Shapes (${selectedNodes.length})`}>
            <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-900 rounded-md p-2">
              {selectedNodes.map((node, index) => {
                const labelText = String((node.getAttrs()?.label as any)?.text || 'Shape');
                const truncatedLabel = labelText.length > 25 ? labelText.substring(0, 22) + '...' : labelText;
                const isLast = index === selectedNodes.length - 1;
                return (
                  <div
                    key={node.id}
                    className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${isLast
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    title={labelText}
                  >
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-[10px] font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate">{truncatedLabel}</span>
                    {isLast && <span className="text-[10px] text-blue-500 dark:text-blue-400">Primary</span>}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              Primary item is used as reference for size matching
            </p>
          </Section>

          {/* Selected Connections (if any) */}
          {selectedEdges.length > 0 && (
            <Section title={`Selected Connections (${selectedEdges.length})`}>
              <div className="max-h-28 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-900 rounded-md p-2">
                {selectedEdges.map((edge, index) => {
                  const sourceCell = edge.getSourceCell();
                  const targetCell = edge.getTargetCell();
                  const sourceLabel = sourceCell?.isNode() ? String((sourceCell.getAttrs()?.label as any)?.text || 'Shape').substring(0, 10) : '?';
                  const targetLabel = targetCell?.isNode() ? String((targetCell.getAttrs()?.label as any)?.text || 'Shape').substring(0, 10) : '?';
                  return (
                    <div
                      key={edge.id}
                      className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded text-gray-600 dark:text-gray-400"
                    >
                      <span className="w-4 h-4 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-[9px] font-medium shrink-0">
                        {index + 1}
                      </span>
                      <span className="truncate">{sourceLabel}</span>
                      <span className="text-gray-400">→</span>
                      <span className="truncate">{targetLabel}</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Alignment */}
          <Section title="Alignment">
            <div className="grid grid-cols-6 gap-1">
              <button onClick={handleAlignLeft} title="Align Left" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"><AlignStartVertical size={18} className="text-gray-700 dark:text-gray-300" /></button>
              <button onClick={handleAlignCenterH} title="Align Center Horizontal" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"><AlignCenterVertical size={18} className="text-gray-700 dark:text-gray-300" /></button>
              <button onClick={handleAlignRight} title="Align Right" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"><AlignEndVertical size={18} className="text-gray-700 dark:text-gray-300" /></button>
              <button onClick={handleAlignTop} title="Align Top" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"><AlignStartHorizontal size={18} className="text-gray-700 dark:text-gray-300" /></button>
              <button onClick={handleAlignCenterV} title="Align Center Vertical" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"><AlignCenterHorizontal size={18} className="text-gray-700 dark:text-gray-300" /></button>
              <button onClick={handleAlignBottom} title="Align Bottom" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors"><AlignEndHorizontal size={18} className="text-gray-700 dark:text-gray-300" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={handleDistributeH} className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                <AlignHorizontalDistributeCenter size={14} /> Distribute H
              </button>
              <button onClick={handleDistributeV} className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                <AlignVerticalDistributeCenter size={14} /> Distribute V
              </button>
            </div>
          </Section>

          {/* Sizing */}
          <Section title="Size">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleMatchSize('width')} className="py-1.5 px-2 text-[11px] border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                  Match Width
                </button>
                <button onClick={() => handleMatchSize('height')} className="py-1.5 px-2 text-[11px] border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                  Match Height
                </button>
              </div>
              <button onClick={() => handleMatchSize('both')} className="w-full py-2 text-xs font-medium border rounded bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 transition-colors flex items-center justify-center gap-2">
                <span className="text-lg leading-none">⤢</span> Match Size
              </button>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                Matches size to the last selected item
              </p>
            </div>
          </Section>

          {/* Grouping */}
          <Section title="Grouping">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleGroupSelected} className="flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                <Group size={16} /> Group
              </button>
              <button onClick={handleUngroupSelected} className="flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
                <Ungroup size={16} /> Ungroup
              </button>
            </div>
          </Section>

          <div className="border-t border-gray-100 dark:border-gray-700 my-4"></div>

          {/* Fill */}
          <Section title="Fill">
            <ColorRow color={fillColor} onChange={handleFillColorChange} />
            <ColorPalette selectedColor={fillColor} onColorSelect={handleFillColorChange} />
          </Section>

          {/* Border */}
          <Section title="Border">
            <ColorRow color={strokeColor} onChange={handleStrokeColorChange} />
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </Section>

          <Section title="Actions">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={handleCopyStyle}
                className="flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                Copy Style
              </button>
              <button
                onClick={handlePasteStyle}
                disabled={!clipboardStyle}
                className={`flex items-center justify-center gap-2 py-2 border rounded transition-colors ${clipboardStyle ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300' : 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'}`}
              >
                Paste Style
              </button>
              <button
                onClick={handleCopySize}
                className="flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                Copy Size
              </button>
              <button
                onClick={handlePasteSize}
                disabled={!clipboardSize}
                className={`flex items-center justify-center gap-2 py-2 border rounded transition-colors ${clipboardSize ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300' : 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'}`}
              >
                Paste Size
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDuplicateSelected}
                className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                title="Duplicate (Ctrl+D)"
              >
                <Copy size={16} className="text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Duplicate</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 transition-colors"
                title="Delete (Del)"
              >
                <Trash2 size={16} className="text-red-500" />
                <span className="text-xs text-red-500">Delete</span>
              </button>
            </div>
          </Section>
        </div>
      </div>
    );
  }



  // Multi-edge selection panel (when only edges are selected, no nodes)
  if (selectedEdges.length > 1 && selectedNodes.length === 0) {
    const arrowTypes = ['none', 'block', 'classic', 'diamond', 'circle'] as const;

    return (
      <div className="w-72 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            🔗 {selectedEdges.length} Connections Selected
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Selected Connections List */}
          <Section title="Selected Connections">
            <div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-900 rounded-md p-2">
              {selectedEdges.map((edge, index) => {
                const sourceCell = edge.getSourceCell();
                const targetCell = edge.getTargetCell();
                const sourceLabel = sourceCell?.isNode() ? String((sourceCell.getAttrs()?.label as any)?.text || 'Shape').substring(0, 12) : '?';
                const targetLabel = targetCell?.isNode() ? String((targetCell.getAttrs()?.label as any)?.text || 'Shape').substring(0, 12) : '?';
                const edgeLabel = (edge.getLabels()?.[0]?.attrs?.label as any)?.text || '';
                return (
                  <div
                    key={edge.id}
                    className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={`${sourceLabel} → ${targetLabel}${edgeLabel ? ` (${edgeLabel})` : ''}`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-[9px] font-medium shrink-0">
                      {index + 1}
                    </span>
                    <span className="truncate">{sourceLabel}</span>
                    <span className="text-gray-400">→</span>
                    <span className="truncate">{targetLabel}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Line Style">
            <div className="grid grid-cols-3 gap-2">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    selectedEdges.forEach(edge => {
                      edge.setAttrs({
                        line: {
                          strokeDasharray: style === 'dashed' ? '8 4' : style === 'dotted' ? '2 2' : '',
                        },
                      });
                    });
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-colors"
                >
                  <div className="w-8 h-0.5 bg-gray-600 dark:bg-gray-400" style={{
                    backgroundImage: style === 'dashed' ? 'repeating-linear-gradient(90deg, currentColor 0, currentColor 8px, transparent 8px, transparent 12px)' :
                      style === 'dotted' ? 'repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px)' : 'none',
                    backgroundColor: style === 'solid' ? 'currentColor' : 'transparent',
                  }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{style}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Line Type">
            <div className="grid grid-cols-2 gap-2">
              {(['normal', 'rounded', 'smooth', 'ortho'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const connector = type === 'smooth' ? 'smooth' : 'rounded';
                    const router = type === 'ortho' ? 'manhattan' : 'normal';

                    selectedEdges.forEach(edge => {
                      if (type === 'smooth') {
                        edge.setConnector('smooth');
                        edge.setRouter('normal');
                      } else if (type === 'rounded') {
                        edge.setConnector('rounded', { radius: 8 });
                        edge.setRouter('normal');
                      } else if (type === 'ortho') {
                        edge.setConnector('rounded', { radius: 8 });
                        edge.setRouter('manhattan');
                      } else {
                        edge.setConnector('normal');
                        edge.setRouter('normal');
                      }
                    });
                  }}
                  className="py-2 px-3 rounded border text-xs capitalize border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                >
                  {type === 'normal' ? 'Straight' : type === 'rounded' ? 'Rounded' : type === 'smooth' ? 'Curved' : 'Orthogonal'}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Line Color">
            <ColorPalette
              selectedColor={selectedEdges[0]?.getAttrs()?.line?.stroke as string || '#333'}
              onColorSelect={(color) => {
                selectedEdges.forEach(edge => {
                  edge.setAttrs({ line: { stroke: color } });
                });
              }}
            />
          </Section>

          <Section title="Line Width">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                defaultValue="2"
                onChange={(e) => {
                  const width = parseFloat(e.target.value);
                  selectedEdges.forEach(edge => {
                    edge.setAttrs({ line: { strokeWidth: width } });
                  });
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">px</span>
            </div>
          </Section>

          <Section title="Source Arrow (Start)">
            <div className="grid grid-cols-4 gap-1">
              {([
                { type: 'none', icon: '—', label: 'None' },
                { type: 'classic', icon: '→', label: 'Arrow' },
                { type: 'block', icon: '▶', label: 'Triangle' },
                { type: 'diamond', icon: '◇', label: 'Diamond' },
                { type: 'circle', icon: '●', label: 'Circle' },
                { type: 'circlePlus', icon: '⊕', label: 'Plus Circle' },
                { type: 'ellipse', icon: '○', label: 'Ellipse' },
                { type: 'cross', icon: '✕', label: 'Cross' },
              ] as const).map(item => (
                <button
                  key={item.type}
                  onClick={() => {
                    setSourceArrow(item.type);
                    selectedEdges.forEach(edge => {
                      if (item.type === 'none') {
                        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), sourceMarker: '' } });
                      } else {
                        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), sourceMarker: { name: item.type, width: 12, height: 8 } } });
                      }
                    });
                  }}
                  className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-colors"
                  title={item.label}
                >
                  <span className="text-sm">{item.icon}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Target Arrow (End)">
            <div className="grid grid-cols-4 gap-1">
              {([
                { type: 'none', icon: '—', label: 'None' },
                { type: 'classic', icon: '→', label: 'Arrow' },
                { type: 'block', icon: '▶', label: 'Triangle' },
                { type: 'diamond', icon: '◇', label: 'Diamond' },
                { type: 'circle', icon: '●', label: 'Circle' },
                { type: 'circlePlus', icon: '⊕', label: 'Plus Circle' },
                { type: 'ellipse', icon: '○', label: 'Ellipse' },
                { type: 'cross', icon: '✕', label: 'Cross' },
              ] as const).map(item => (
                <button
                  key={item.type}
                  onClick={() => {
                    setTargetArrow(item.type);
                    selectedEdges.forEach(edge => {
                      if (item.type === 'none') {
                        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), targetMarker: '' } });
                      } else {
                        edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), targetMarker: { name: item.type, width: 12, height: 8 } } });
                      }
                    });
                  }}
                  className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-colors"
                  title={item.label}
                >
                  <span className="text-sm">{item.icon}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Actions">
            <button
              onClick={handleDeleteSelected}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 transition-colors"
              title="Delete (Del)"
            >
              <Trash2 size={16} className="text-red-500" />
              <span className="text-xs text-red-500">Delete All</span>
            </button>
          </Section>
        </div>
      </div>
    );
  }

  // Single edge selected (or 1 edge with nodes) - handled by main return
  // Also handles case when 1 edge is in selectedEdges but no selectedCell
  if (selectedEdges.length === 1 && selectedNodes.length === 0 && !selectedCell) {
    // Force show edge properties
    const edge = selectedEdges[0];
    const edgeAttrs = edge.getAttrs();
    const lineAttrs = (edgeAttrs.line || {}) as Record<string, any>;
    const arrowTypes = ['none', 'block', 'classic', 'diamond', 'circle'] as const;
    const currentSourceMarker = lineAttrs.sourceMarker?.name || 'none';
    const currentTargetMarker = lineAttrs.targetMarker?.name || (lineAttrs.targetMarker === '' ? 'none' : 'classic');

    return (
      <div className="w-72 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            🔗 Connection Properties
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <Section title="Line Style">
            <div className="grid grid-cols-3 gap-2">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    edge.setAttrs({
                      line: {
                        strokeDasharray: style === 'dashed' ? '8 4' : style === 'dotted' ? '2 2' : '',
                      },
                    });
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${(lineAttrs.strokeDasharray === '8 4' && style === 'dashed') ||
                    (lineAttrs.strokeDasharray === '2 2' && style === 'dotted') ||
                    (!lineAttrs.strokeDasharray && style === 'solid')
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400'
                    }`}
                >
                  <div className="w-8 h-0.5 bg-gray-600 dark:bg-gray-400" style={{
                    backgroundImage: style === 'dashed' ? 'repeating-linear-gradient(90deg, currentColor 0, currentColor 8px, transparent 8px, transparent 12px)' :
                      style === 'dotted' ? 'repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px)' : 'none',
                    backgroundColor: style === 'solid' ? 'currentColor' : 'transparent',
                  }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{style}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Line Color">
            <ColorRow
              color={lineAttrs.stroke as string || '#333'}
              onChange={(color) => edge.setAttrs({ line: { stroke: color } })}
            />
            <ColorPalette
              selectedColor={lineAttrs.stroke as string || '#333'}
              onColorSelect={(color) => edge.setAttrs({ line: { stroke: color } })}
            />
          </Section>

          <Section title="Line Width">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={lineAttrs.strokeWidth || 2}
                onChange={(e) => edge.setAttrs({ line: { strokeWidth: parseFloat(e.target.value) } })}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">{lineAttrs.strokeWidth || 2}px</span>
            </div>
          </Section>

          <Section title="Source Arrow (Start)">
            <div className="grid grid-cols-5 gap-1">
              {arrowTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'none') {
                      edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), sourceMarker: '' } });
                    } else {
                      edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), sourceMarker: { name: type, width: 12, height: 8 } } });
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded border transition-colors ${currentSourceMarker === type || (type === 'none' && !lineAttrs.sourceMarker)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400'
                    }`}
                  title={type}
                >
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 capitalize">{type === 'none' ? '—' : type.slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Target Arrow (End)">
            <div className="grid grid-cols-5 gap-1">
              {arrowTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'none') {
                      edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), targetMarker: '' } });
                    } else {
                      edge.setAttrs({ line: { ...(edge.getAttrs().line || {}), targetMarker: { name: type, width: 12, height: 8 } } });
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded border transition-colors ${currentTargetMarker === type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400'
                    }`}
                  title={type}
                >
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 capitalize">{type === 'none' ? '—' : type.slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Actions">
            <button
              onClick={handleDeleteSelected}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 transition-colors"
              title="Delete (Del)"
            >
              <Trash2 size={16} className="text-red-500" />
              <span className="text-xs text-red-500">Delete</span>
            </button>
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          {isNode ? '📦 Shape Properties' : '🔗 Connection Properties'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {isNode && (
          <>
            {/* Label */}
            <Section title="Text">
              <textarea
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                spellCheck={true}
                lang={spellcheckLanguage}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                placeholder="Enter text..."
              />

              <div className="grid grid-cols-2 gap-2 mt-2">
                <select
                  value={fontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
              </div>

              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Text Color</label>
                <ColorRow color={textColor} onChange={handleTextColorChange} />
              </div>

              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Text Style</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleFontWeightChange(fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`flex-1 py-1.5 px-2 text-xs rounded border font-bold ${fontWeight === 'bold' ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onClick={() => handleFontStyleChange(fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`flex-1 py-1.5 px-2 text-xs rounded border italic ${fontStyle === 'italic' ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    onClick={() => handleTextDecorationChange(textDecoration === 'underline' ? 'none' : 'underline')}
                    className={`flex-1 py-1.5 px-2 text-xs rounded border underline ${textDecoration === 'underline' ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                    title="Underline"
                  >
                    U
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Text Alignment</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleTextAlignChange('left')}
                    className={`flex-1 py-1.5 px-2 text-xs rounded border ${textAlign === 'left' ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                    title="Align Left"
                  >
                    ⬅️ Left
                  </button>
                  <button
                    onClick={() => handleTextAlignChange('center')}
                    className={`flex-1 py-1.5 px-2 text-xs rounded border ${textAlign === 'center' ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                    title="Align Center"
                  >
                    ↔️ Center
                  </button>
                  <button
                    onClick={() => handleTextAlignChange('right')}
                    className={`flex-1 py-1.5 px-2 text-xs rounded border ${textAlign === 'right' ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                    title="Align Right"
                  >
                    Right ➡️
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Shape">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(['rect', 'ellipse', 'none'] as const).map(shape => (
                  <button
                    key={shape}
                    onClick={() => applyNodeShape(shape)}
                    className={`py-2 px-2 rounded border text-xs capitalize ${nodeShape === shape
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {shape === 'none' ? 'No Shape' : shape}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (selectedCell && selectedCell.isNode?.()) {
                    setShapeChangeTarget(selectedCell as Node);
                    setShowShapeDialog(true);
                  }
                }}
                className="w-full py-2 px-3 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                🔄 Change to Different Shape...
              </button>
            </Section>

            {/* Image (for image nodes) */}
            {(selectedCell as Node)?.shape === 'image' && (
              <Section title="Image">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="Enter image URL..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const dataUrl = evt.target?.result as string;
                            handleImageUrlChange(dataUrl);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full py-2 px-3 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    📁 Choose Image File...
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Paste an image URL or drag to resize after adding
                </div>
              </Section>
            )}

            {/* Text Decorations */}
            <Section title="Text Decorations">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Prefix (before text)
                  </label>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    Current: {prefixDecoration || '(none)'}
                  </div>

                  {/* Numbers */}
                  <details className="mb-2" open>
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">🔢 Numbers</summary>
                    <div className="grid grid-cols-9 gap-1 mb-2">
                      {['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].map(emoji => (
                        <button key={emoji} onClick={() => handlePrefixDecorationChange((prefixDecoration || '') + emoji)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{emoji}</button>
                      ))}
                    </div>
                  </details>

                  {/* Faces */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">😊 Faces</summary>
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {['😊', '😁', '😂', '😍', '😎', '😇', '🤔', '😐'].map(emoji => (
                        <button key={emoji} onClick={() => handlePrefixDecorationChange((prefixDecoration || '') + emoji)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{emoji}</button>
                      ))}
                    </div>
                  </details>

                  {/* Task Progress */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">✓ Task Progress</summary>
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {['▶️', '🔵', '🟢', '🟡', '🟠', '🔴', '✅', '⏸️'].map(emoji => (
                        <button key={emoji} onClick={() => handlePrefixDecorationChange((prefixDecoration || '') + emoji)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{emoji}</button>
                      ))}
                    </div>
                  </details>

                  {/* Stars */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">⭐ Stars</summary>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['⭐', '🌟', '💫', '✨', '🔆', '🌠', '⚡'].map(emoji => (
                        <button key={emoji} onClick={() => handlePrefixDecorationChange((prefixDecoration || '') + emoji)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{emoji}</button>
                      ))}
                    </div>
                  </details>

                  {/* People */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">👤 People</summary>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['👤', '👥', '👨', '👩', '👶', '🧑', '👮'].map(emoji => (
                        <button key={emoji} onClick={() => handlePrefixDecorationChange((prefixDecoration || '') + emoji)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{emoji}</button>
                      ))}
                    </div>
                  </details>

                  {/* Arrows */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">➡️ Arrows</summary>
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'].map(emoji => (
                        <button key={emoji} onClick={() => handlePrefixDecorationChange((prefixDecoration || '') + emoji)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{emoji}</button>
                      ))}
                    </div>
                  </details>

                  {/* Symbols */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">🔣 Symbols</summary>
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {['✅', '❌', '⚠️', '🔥', '💡', '🎯', '📌', '🚀', '💎', '🏆', '❓', '💬', '🔔', '📅', '🔒', '🔑'].map(emoji => (
                        <button key={emoji} onClick={() => handlePrefixDecorationChange((prefixDecoration || '') + emoji)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{emoji}</button>
                      ))}
                    </div>
                  </details>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const current = prefixDecoration || '';
                        if (current.length > 0) {
                          handlePrefixDecorationChange(current.slice(0, -1));
                        }
                      }}
                      className="flex-1 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={!prefixDecoration}
                    >
                      ⌫ Remove Last
                    </button>
                    <button
                      onClick={() => handlePrefixDecorationChange('')}
                      className="flex-1 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={!prefixDecoration}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Suffix (after text)
                  </label>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    Current: {suffixDecoration || '(none)'}
                  </div>

                  {/* Flags */}
                  <details className="mb-2" open>
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">🚩 Flags</summary>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['🚩', '🏁', '🏳️', '🏴', '🎌', '🏴‍☠️', '🏳️‍🌈'].map(flag => (
                        <button key={flag} onClick={() => handleSuffixDecorationChange((suffixDecoration || '') + flag)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{flag}</button>
                      ))}
                    </div>
                  </details>

                  {/* Stars */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">⭐ Stars</summary>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['⭐', '🌟', '💫', '✨', '🔆', '🌠', '⚡'].map(star => (
                        <button key={star} onClick={() => handleSuffixDecorationChange((suffixDecoration || '') + star)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{star}</button>
                      ))}
                    </div>
                  </details>

                  {/* Check marks */}
                  <details className="mb-2">
                    <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer mb-1">✓ Status</summary>
                    <div className="grid grid-cols-6 gap-1 mb-2">
                      {['✅', '✓', '✔️', '❌', '✗', '×'].map(check => (
                        <button key={check} onClick={() => handleSuffixDecorationChange((suffixDecoration || '') + check)} className="p-1 text-lg hover:bg-blue-50 dark:hover:bg-blue-900 rounded">{check}</button>
                      ))}
                    </div>
                  </details>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const current = suffixDecoration || '';
                        if (current.length > 0) {
                          handleSuffixDecorationChange(current.slice(0, -1));
                        }
                      }}
                      className="flex-1 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={!suffixDecoration}
                    >
                      ⌫ Remove Last
                    </button>
                    <button
                      onClick={() => handleSuffixDecorationChange('')}
                      className="flex-1 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={!suffixDecoration}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </Section>

            {/* Timeline Properties - Only show for timeline nodes */}
            {selectedCell && isNode && (selectedCell as Node).getData()?.isTimeline && (
              <Section title="Timeline Properties">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={timelineDate}
                      onChange={(e) => handleTimelineDateChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {((selectedCell as Node).getData()?.eventType === 'period' || (selectedCell as Node).getData()?.eventType === 'phase') && (
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        End Date (for periods/phases)
                      </label>
                      <input
                        type="date"
                        value={timelineEndDate}
                        onChange={(e) => handleTimelineEndDateChange(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    <textarea
                      value={timelineDescription}
                      onChange={(e) => handleTimelineDescriptionChange(e.target.value)}
                      placeholder="Event description..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Priority
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['low', 'medium', 'high'] as const).map(priority => (
                        <button
                          key={priority}
                          onClick={() => handleTimelinePriorityChange(priority)}
                          className={`px-2 py-1.5 text-xs rounded border ${timelinePriority === priority
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {(['planned', 'in-progress', 'completed', 'cancelled'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleTimelineStatusChange(status)}
                          className={`px-2 py-1.5 text-xs rounded border ${timelineStatus === status
                            ? 'bg-blue-500 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                        >
                          {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* Fill */}
            <Section title="Fill">
              <ColorRow color={fillColor} onChange={handleFillColorChange} />
              <ColorPalette selectedColor={fillColor} onColorSelect={handleFillColorChange} />
            </Section>

            {/* Border */}
            <Section title="Border">
              <ColorRow color={strokeColor} onChange={handleStrokeColorChange} />
              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Width: {strokeWidth}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Border Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => handleBorderStyleChange(style)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${borderStyle === style
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400'
                        }`}
                    >
                      <div className="w-8 h-0.5 bg-gray-600 dark:bg-gray-400" style={{
                        backgroundImage: style === 'dashed' ? 'repeating-linear-gradient(90deg, currentColor 0, currentColor 8px, transparent 8px, transparent 12px)' :
                          style === 'dotted' ? 'repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px)' : 'none',
                        backgroundColor: style === 'solid' ? 'currentColor' : 'transparent',
                      }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{style}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Corner Radius: {cornerRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={cornerRadius}
                  onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </Section>

            {/* Opacity */}
            <Section title="Appearance">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 mt-3">
                Rotation: {rotation}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={rotation}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </Section>

            {/* Shadow */}
            <Section title="Shadow">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={shadowEnabled}
                  onChange={(e) => handleShadowToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Enable Shadow</span>
              </label>

              {shadowEnabled && (
                <>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Blur: {shadowBlur}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={shadowBlur}
                    onChange={(e) => handleShadowChange(Number(e.target.value), shadowOffsetX, shadowOffsetY, shadowColor)}
                    className="w-full accent-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Offset X: {shadowOffsetX}
                      </label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={shadowOffsetX}
                        onChange={(e) => handleShadowChange(shadowBlur, Number(e.target.value), shadowOffsetY, shadowColor)}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Offset Y: {shadowOffsetY}
                      </label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={shadowOffsetY}
                        onChange={(e) => handleShadowChange(shadowBlur, shadowOffsetX, Number(e.target.value), shadowColor)}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </Section>

            <Section title="Actions pb-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={handleCopyStyle}
                  className="flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors text-xs"
                >
                  <Copy size={14} /> Copy Style
                </button>
                <button
                  onClick={handlePasteStyle}
                  disabled={!clipboardStyle}
                  className={`flex items-center justify-center gap-2 py-2 border rounded transition-colors text-xs ${clipboardStyle ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300' : 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'}`}
                >
                  <Clipboard size={14} /> Paste Style
                </button>
                <button
                  onClick={handleCopySize}
                  className="flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors text-xs"
                >
                  <Maximize size={14} /> Copy Size
                </button>
                <button
                  onClick={handlePasteSize}
                  disabled={!clipboardSize}
                  className={`flex items-center justify-center gap-2 py-2 border rounded transition-colors text-xs ${clipboardSize ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300' : 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'}`}
                >
                  <Minimize size={14} /> Paste Size
                </button>
              </div>
            </Section>
          </>
        )}

        {isEdge && (
          <>
            {/* Edge Label */}
            <Section title="Label">
              <textarea
                value={edgeLabel}
                onChange={(e) => handleEdgeLabelChange(e.target.value)}
                spellCheck={true}
                lang={spellcheckLanguage}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                placeholder="Enter label..."
              />
              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Text Color</label>
                <ColorRow color={edgeLabelColor} onChange={handleEdgeLabelColorChange} />
              </div>
              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Label Background</label>
                <ColorRow color={edgeLabelBg} onChange={handleEdgeLabelBgChange} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <label className="text-xs text-gray-500 dark:text-gray-400">Show Border</label>
                <button
                  onClick={() => handleEdgeLabelBorderVisibilityChange(!showEdgeLabelBorder)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showEdgeLabelBorder ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showEdgeLabelBorder ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              {showEdgeLabelBorder && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Border Color</label>
                  <ColorRow color={edgeLabelBorderColor} onChange={handleEdgeLabelBorderColorChange} />
                </div>
              )}
            </Section>

            <Section title="Line Actions">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={handleSelectAllEdges}
                  className="py-2 px-3 rounded border text-xs font-semibold text-blue-700 dark:text-blue-300 border-blue-500 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                >
                  Select All Lines
                </button>
                <button
                  onClick={handleApplyEdgesToAll}
                  className="py-2 px-3 rounded border text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500 bg-emerald-50 dark:bg-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors"
                >
                  Apply Style to All
                </button>
              </div>

              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                Choose a line type then apply to all lines to reduce overlap (try Orthogonal).
              </label>

              {/* Edge Connector */}
            </Section>

            {/* Edge Connector */}
            <Section title="Line Type">
              <div className="grid grid-cols-2 gap-2">
                {(['normal', 'rounded', 'smooth', 'ortho'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleEdgeConnectorChange(type)}
                    className={`py-2 px-3 rounded border text-xs capitalize ${edgeConnector === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {type === 'normal' ? 'Straight' : type === 'rounded' ? 'Rounded' : type === 'smooth' ? 'Curved' : 'Orthogonal'}
                  </button>
                ))}
              </div>
            </Section>

            {/* Edge Style */}
            <Section title="Line Style">
              <div className="grid grid-cols-3 gap-2">
                {(['solid', 'dashed', 'dotted'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => handleEdgeStyleChange(style)}
                    className={`py-2 px-3 rounded border text-xs capitalize ${edgeStyle === style
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </Section>

            {/* Line Hops */}
            <Section title="Line Hops">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Show arc when lines cross
                </span>
                <button
                  onClick={() => handleLineHopsChange(!lineHops)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${lineHops ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${lineHops ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </Section>

            {/* Edge Color */}
            <Section title="Line Color">
              <ColorRow color={edgeColor} onChange={handleEdgeColorChange} />
              <ColorPalette selectedColor={edgeColor} onColorSelect={handleEdgeColorChange} />
            </Section>

            {/* Edge Width */}
            <Section title="Line Width">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Width: {edgeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={edgeWidth}
                onChange={(e) => handleEdgeWidthChange(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </Section>

            {/* Line start marker */}
            <Section title="Line Start">
              <div className="grid grid-cols-4 gap-1">
                {([
                  { type: 'none', icon: '—', label: 'None' },
                  { type: 'classic', icon: '→', label: 'Arrow' },
                  { type: 'block', icon: '▶', label: 'Triangle' },
                  { type: 'diamond', icon: '◇', label: 'Diamond' },
                  { type: 'circle', icon: '●', label: 'Circle' },
                  { type: 'circlePlus', icon: '⊕', label: 'Plus Circle' },
                  { type: 'ellipse', icon: '○', label: 'Ellipse' },
                  { type: 'cross', icon: '✕', label: 'Cross' },
                ] as const).map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleSourceArrowChange(item.type)}
                    className={`py-2 px-1 rounded border text-[10px] flex flex-col items-center ${sourceArrow === item.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                      }`}
                    title={item.label}
                  >
                    <span className="text-sm">{item.icon}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Line end marker */}
            <Section title="Line End">
              <div className="grid grid-cols-4 gap-1">
                {([
                  { type: 'none', icon: '—', label: 'None' },
                  { type: 'classic', icon: '→', label: 'Arrow' },
                  { type: 'block', icon: '▶', label: 'Triangle' },
                  { type: 'diamond', icon: '◇', label: 'Diamond' },
                  { type: 'circle', icon: '●', label: 'Circle' },
                  { type: 'circlePlus', icon: '⊕', label: 'Plus Circle' },
                  { type: 'ellipse', icon: '○', label: 'Ellipse' },
                  { type: 'cross', icon: '✕', label: 'Cross' },
                ] as const).map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleTargetArrowChange(item.type)}
                    className={`py-2 px-1 rounded border text-[10px] flex flex-col items-center ${targetArrow === item.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                      }`}
                    title={item.label}
                  >
                    <span className="text-sm">{item.icon}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Actions">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyStyle}
                  className="flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors text-xs"
                >
                  <Copy size={14} /> Copy Style
                </button>
                <button
                  onClick={handlePasteStyle}
                  disabled={!clipboardStyle}
                  className={`flex items-center justify-center gap-2 py-2 border rounded transition-colors text-xs ${clipboardStyle ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300' : 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'}`}
                >
                  <Clipboard size={14} /> Paste Style
                </button>
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Shape Change Dialog */}
      {showShapeDialog && shapeChangeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={() => setShowShapeDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Shape</h3>
              <button
                onClick={() => setShowShapeDialog(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select a new shape to replace "{String(shapeChangeTarget.getAttrs().label?.text) || 'this shape'}". Text and connections will be preserved.
              </p>
              {(() => {
                // Only show basic shapes for simplicity
                const categories = [
                  { name: 'Basic Shapes', shapes: BASIC_SHAPES },
                ];

                return categories.map(category => (
                  <div key={category.name} className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{category.name}</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {category.shapes.map((shape: any, idx: number) => {
                        const fillColor = String(shape.attrs?.body?.fill || '#e3f2fd');
                        const strokeColor = String(shape.attrs?.body?.stroke || '#1976d2');
                        return (
                          <button
                            key={`${shape.type}-${idx}-${shape.label}`}
                            onClick={() => handleReplaceShape(shape.label)}
                            className="p-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-colors flex flex-col items-center gap-2"
                          >
                            <svg width="48" height="48" viewBox="0 0 48 48">
                              {shape.type === 'rect' && shape.attrs?.body?.rx ? (
                                <rect x="4" y="12" width="40" height="24" rx="6" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.type === 'rect' ? (
                                <rect x="4" y="12" width="40" height="24" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.type === 'ellipse' ? (
                                <ellipse cx="24" cy="24" rx="20" ry="12" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.type === 'circle' ? (
                                <circle cx="24" cy="24" r="16" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.type === 'polygon' && shape.label === 'Triangle' ? (
                                <polygon points="24,8 44,36 4,36" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.type === 'polygon' && shape.label === 'Pentagon' ? (
                                <polygon points="24,6 42,18 36,38 12,38 6,18" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.type === 'polygon' && shape.label === 'Hexagon' ? (
                                <polygon points="24,4 40,14 40,34 24,44 8,34 8,14" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.label === 'Star' ? (
                                <polygon points="24,2 29,17 45,17 32,27 37,42 24,32 11,42 16,27 3,17 19,17" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.label === 'Parallelogram' ? (
                                <polygon points="8,32 16,16 40,16 32,32" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.label === 'Trapezoid' ? (
                                <polygon points="12,32 8,16 40,16 36,32" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              ) : shape.label === 'Image' ? (
                                <><rect x="6" y="6" width="36" height="36" fill="#f0f0f0" stroke={strokeColor} strokeWidth="2" />
                                  <text x="24" y="28" fontSize="20" textAnchor="middle" fill="#666">🖼️</text></>
                              ) : (
                                <rect x="4" y="12" width="40" height="24" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                              )}
                            </svg>
                            <div className="text-xs text-gray-700 dark:text-gray-300">{shape.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {title}
      </label>
      {children}
    </div>
  );
}

function ColorRow({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  // HTML color input only accepts hex colors, not "transparent" or other values
  const isValidHexColor = /^#[0-9A-Fa-f]{6}$/.test(color);
  const colorInputValue = isValidHexColor ? color : '#ffffff';

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={colorInputValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono uppercase bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        placeholder="#ffffff or transparent"
      />
    </div>
  );
}

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div className="grid grid-cols-10 gap-1 mt-2">
      {COLOR_PALETTE.slice(0, 50).map((color) => (
        <button
          key={color}
          onClick={() => onColorSelect(color)}
          className={`w-5 h-5 rounded-sm border ${selectedColor.toLowerCase() === color.toLowerCase()
            ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}
