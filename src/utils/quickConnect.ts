/**
 * Quick Connect Mode for Flowcharts
 * Provides hover arrows on nodes for quick shape addition and connection
 * Similar to draw.io's approach
 */

import type { Graph, Node, Edge } from '@antv/x6';
import { getNextThemeColors } from './theme';
import { FULL_PORTS_CONFIG } from '../config/shapes';

export interface QuickConnectOptions {
  colorScheme: string;
  defaultShape: 'rect' | 'ellipse' | 'polygon';
  nodeSpacing: number;
  arrowSize: number;
  showOnHover: boolean;
}

const DEFAULT_OPTIONS: QuickConnectOptions = {
  colorScheme: 'default',
  defaultShape: 'rect',
  nodeSpacing: 80,
  arrowSize: 20,
  showOnHover: true,
};

// Direction arrow positions
export type ArrowDirection = 'top' | 'right' | 'bottom' | 'left';

interface ArrowPosition {
  direction: ArrowDirection;
  dx: number;  // Offset from node center
  dy: number;
  rotation: number;
}

const ARROW_POSITIONS: ArrowPosition[] = [
  { direction: 'top', dx: 0, dy: -1, rotation: -90 },
  { direction: 'right', dx: 1, dy: 0, rotation: 0 },
  { direction: 'bottom', dx: 0, dy: 1, rotation: 90 },
  { direction: 'left', dx: -1, dy: 0, rotation: 180 },
];

/**
 * Quick Connect Manager - handles the hover arrows UI
 */
export class QuickConnectManager {
  private graph: Graph;
  private options: QuickConnectOptions;
  private currentNode: Node | null = null;
  private arrowElements: SVGElement[] = [];
  private enabled: boolean = true;
  private container: SVGGElement | null = null;

  constructor(graph: Graph, options: Partial<QuickConnectOptions> = {}) {
    this.graph = graph;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.setupEventListeners();
  }

  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private isMouseOverContainer: boolean = false;

  /**
   * Setup event listeners for node hover
   */
  private setupEventListeners(): void {
    this.graph.on('node:mouseenter', ({ node }) => {
      if (this.enabled && !this.isSpecialNode(node)) {
        // Cancel any pending hide
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.showArrows(node);
      }
    });

    this.graph.on('node:mouseleave', ({ node }) => {
      // Longer delay to allow moving to arrows
      this.scheduleHide(node, 300);
    });

    // Update positions on scale/translate (zoom and pan)
    this.graph.on('scale', () => {
      if (this.currentNode) {
        this.updateArrowPositions();
      }
    });
    
    this.graph.on('translate', () => {
      if (this.currentNode) {
        this.updateArrowPositions();
      }
    });
    
    // Also track when the node itself moves
    this.graph.on('node:moved', ({ node }) => {
      if (this.currentNode && this.currentNode.id === node.id) {
        this.updateArrowPositions();
      }
    });
    
    // Hide on click elsewhere
    this.graph.on('blank:click', () => this.hideArrows());
    this.graph.on('cell:click', ({ cell }) => {
      if (cell.isNode() && cell.id !== this.currentNode?.id) {
        this.hideArrows();
      }
    });
  }

  /**
   * Schedule hide with delay, can be cancelled
   */
  private scheduleHide(node: Node, delay: number): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hideTimeout = setTimeout(() => {
      if (this.currentNode === node && !this.isMouseOverContainer) {
        this.hideArrows();
      }
      this.hideTimeout = null;
    }, delay);
  }

  /**
   * Update arrow positions after zoom/pan
   */
  private updateArrowPositions(): void {
    if (!this.currentNode || !this.container) return;
    
    const bbox = this.currentNode.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    this.arrowElements.forEach((arrow, index) => {
      const pos = ARROW_POSITIONS[index];
      const arrowX = centerX + pos.dx * (bbox.width / 2 + this.options.arrowSize + 5);
      const arrowY = centerY + pos.dy * (bbox.height / 2 + this.options.arrowSize + 5);
      arrow.setAttribute('transform', `translate(${arrowX}, ${arrowY}) rotate(${pos.rotation})`);
    });
  }

  /**
   * Check if node is a special type that shouldn't have arrows
   */
  private isSpecialNode(node: Node): boolean {
    const data = node.getData() || {};
    return data.isSwimlane || data.isSwimlaneHeader || data.isQuickConnectArrow;
  }

  /**
   * Show direction arrows around the node
   */
  private showArrows(node: Node): void {
    this.hideArrows();
    this.currentNode = node;

    const bbox = node.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    // Create SVG container for arrows
    // Append to the cells/stage layer so arrows transform with zoom/pan
    const svg = this.graph.view.svg;
    if (!svg) return;
    
    // Find the stage/viewport layer that contains cells (this layer already has transforms applied)
    // In X6, cells are rendered in a <g> element with class "x6-graph-svg-stage"
    let stageLayer = svg.querySelector('.x6-graph-svg-stage') as SVGGElement | null;
    if (!stageLayer) {
      // Fallback: try to find the first <g> that looks like the main content layer
      stageLayer = svg.querySelector('g') as SVGGElement | null;
    }
    
    const appendTarget = stageLayer || svg;

    this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.container.setAttribute('class', 'quick-connect-arrows');
    this.container.style.pointerEvents = 'all';
    
    // Add mouse tracking on container to prevent premature hiding
    this.container.addEventListener('mouseenter', () => {
      this.isMouseOverContainer = true;
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });
    this.container.addEventListener('mouseleave', () => {
      this.isMouseOverContainer = false;
      if (this.currentNode) {
        this.scheduleHide(this.currentNode, 200);
      }
    });
    
    // Append to the stage layer so transforms are correctly applied
    appendTarget.appendChild(this.container);

    ARROW_POSITIONS.forEach(pos => {
      const arrowX = centerX + pos.dx * (bbox.width / 2 + this.options.arrowSize + 5);
      const arrowY = centerY + pos.dy * (bbox.height / 2 + this.options.arrowSize + 5);

      const arrow = this.createArrowElement(arrowX, arrowY, pos.rotation, pos.direction);
      this.container!.appendChild(arrow);
      this.arrowElements.push(arrow);
    });
  }

  /**
   * Create an arrow SVG element
   */
  private createArrowElement(x: number, y: number, rotation: number, direction: ArrowDirection): SVGGElement {
    const size = this.options.arrowSize;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    group.setAttribute('transform', `translate(${x}, ${y}) rotate(${rotation})`);
    group.style.cursor = 'pointer';
    group.style.pointerEvents = 'all';
    group.setAttribute('data-direction', direction);
    group.setAttribute('data-quick-connect', 'true');

    // Background circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', String(size / 2));
    circle.setAttribute('fill', '#5F95FF');
    circle.setAttribute('stroke', '#3B7DD8');
    circle.setAttribute('stroke-width', '2');
    circle.style.opacity = '0.9';
    circle.style.pointerEvents = 'all';
    group.appendChild(circle);

    // Arrow shape (pointing right, rotation handles direction)
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const arrowPath = `M ${-size/4} ${-size/4} L ${size/4} 0 L ${-size/4} ${size/4} Z`;
    arrow.setAttribute('d', arrowPath);
    arrow.setAttribute('fill', 'white');
    arrow.style.pointerEvents = 'none'; // Let circle handle clicks
    group.appendChild(arrow);

    // Store reference to this manager for the click handler
    const self = this;
    const currentDirection = direction;

    // Use capturing phase to ensure we get the click before X6
    const clickHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      self.handleArrowClick(currentDirection);
    };

    group.addEventListener('click', clickHandler, true);
    circle.addEventListener('click', clickHandler, true);

    // Also handle mousedown to prevent X6 from processing
    const mousedownHandler = (e: MouseEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    group.addEventListener('mousedown', mousedownHandler, true);
    circle.addEventListener('mousedown', mousedownHandler, true);

    group.addEventListener('mouseenter', () => {
      circle.setAttribute('fill', '#3B7DD8');
    });

    group.addEventListener('mouseleave', () => {
      circle.setAttribute('fill', '#5F95FF');
    });

    return group;
  }

  /**
   * Handle click on direction arrow - create new connected node
   */
  private handleArrowClick(direction: ArrowDirection): void {
    if (!this.currentNode) return;

    const sourceNode = this.currentNode;
    const bbox = sourceNode.getBBox();
    const { nodeSpacing, colorScheme, defaultShape } = this.options;
    const theme = getNextThemeColors(colorScheme);
    
    // Check if we're in timeline mode
    const currentMode = (window as any).__drawdd_mode;
    const isTimeline = currentMode === 'timeline';
    const sourceData = sourceNode.getData() || {};

    // Ensure source node has ports for connection
    const sourcePorts = (sourceNode as any).getPorts?.() || [];
    if (sourcePorts.length === 0) {
      (sourceNode as any).prop?.('ports', FULL_PORTS_CONFIG);
    }

    // Calculate new node position
    let newX: number, newY: number;
    const newWidth = 120;
    const newHeight = isTimeline ? 55 : 60;

    switch (direction) {
      case 'top':
        newX = bbox.x + bbox.width / 2 - newWidth / 2;
        newY = bbox.y - nodeSpacing - newHeight;
        break;
      case 'right':
        newX = bbox.x + bbox.width + nodeSpacing;
        newY = bbox.y + bbox.height / 2 - newHeight / 2;
        break;
      case 'bottom':
        newX = bbox.x + bbox.width / 2 - newWidth / 2;
        newY = bbox.y + bbox.height + nodeSpacing;
        break;
      case 'left':
        newX = bbox.x - nodeSpacing - newWidth;
        newY = bbox.y + bbox.height / 2 - newHeight / 2;
        break;
    }

    // Create new node with appropriate data based on mode
    const nodeData = isTimeline || sourceData.isTimeline 
      ? { isTimeline: true, eventType: 'event' }
      : {};

    const newNode = this.graph.addNode({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      shape: defaultShape,
      attrs: {
        body: {
          fill: theme.fill,
          stroke: theme.stroke,
          strokeWidth: 2,
          rx: isTimeline ? 8 : 6,
          ry: isTimeline ? 8 : 6,
        },
        label: {
          text: isTimeline ? 'New Event' : 'New Step',
          fill: theme.text,
          fontSize: 14,
        },
      },
      data: nodeData,
      ports: FULL_PORTS_CONFIG as any,
    });

    // Create edge connecting source to new node
    const sourcePort = this.getPortForDirection(direction, true);
    const targetPort = this.getPortForDirection(direction, false);

    this.graph.addEdge({
      source: { cell: sourceNode.id, port: sourcePort },
      target: { cell: newNode.id, port: targetPort },
      attrs: {
        line: {
          stroke: theme.stroke,
          strokeWidth: 2,
          targetMarker: {
            name: 'block',
            size: 8,
          },
        },
      },
      router: { name: 'manhattan' },
      connector: { name: 'rounded', args: { radius: 8 } },
    });

    // Select the new node
    this.graph.cleanSelection();
    this.graph.select(newNode);

    // Hide arrows
    this.hideArrows();

    // Trigger text edit on new node
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('drawdd:edit-cell-text', {
        detail: { cellId: newNode.id }
      }));
    }, 100);
  }

  /**
   * Get port ID for a direction
   */
  private getPortForDirection(direction: ArrowDirection, isSource: boolean): string {
    // Source uses the direction port, target uses opposite
    if (isSource) {
      return direction;
    }
    
    const opposites: Record<ArrowDirection, ArrowDirection> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    return opposites[direction];
  }

  /**
   * Hide all arrow elements
   */
  private hideArrows(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.arrowElements = [];
    this.currentNode = null;
    this.isMouseOverContainer = false;
  }

  /**
   * Enable/disable quick connect mode
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.hideArrows();
    }
  }

  /**
   * Update options
   */
  public updateOptions(options: Partial<QuickConnectOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.hideArrows();
    this.graph.off('node:mouseenter');
    this.graph.off('node:mouseleave');
    this.graph.off('scale');
    this.graph.off('translate');
    this.graph.off('node:moved');
    this.graph.off('blank:click');
    this.graph.off('cell:click');
  }
}

/**
 * Create and attach Quick Connect to a graph
 */
export function createQuickConnect(
  graph: Graph,
  options: Partial<QuickConnectOptions> = {}
): QuickConnectManager {
  return new QuickConnectManager(graph, options);
}
