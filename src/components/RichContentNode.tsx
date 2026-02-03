/**
 * Rich Content Node Component
 * Renders HTML/KaTeX content inside X6 nodes using React shape
 * Dynamically processes current label text on each render
 */
import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { MarkdownRenderer } from './MarkdownRenderer';

interface RichContentNodeProps {
    node?: {
        id: string;
        getData: () => {
            htmlContent?: string;
            text?: string;
            textColor?: string;
            isMindmap?: boolean;
            collapsed?: boolean;
            folderExplorer?: {
                isFolderExplorer: boolean;
                explorerType: 'linked' | 'static';
                path: string;
                isDirectory: boolean;
                isReadOnly: boolean;
            };
        };
        setData: (data: Record<string, unknown>) => void;
        getSize: () => { width: number; height: number };
        getAttrByPath: (path: string) => unknown;
        on: (event: string, callback: () => void) => void;
        off: (event: string, callback: () => void) => void;
    };
    graph?: any; // Use 'any' to avoid X6 type incompatibility
}

/**
 * Process text with inline markdown and KaTeX
 */
/**
 * Process text with inline markdown and KaTeX
 */
function processContent(text: string): string {
    if (!text) return '';

    let result = text;

    // Unescape HTML entities that might prevent regex matching
    result = result
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#36;/g, '$'); // Unescape dollar sign if encoded

    // @ts-ignore
    const k = (typeof window !== 'undefined' && window.katex) ? window.katex : katex;

    // Process display math: $$...$$
    result = result.replace(/\$\$([^$]+)\$\$/g, (_, tex) => {
        try {
            if (k) return k.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
            return `<code>$$${tex}$$</code>`;
        } catch (e) {
            console.error('KaTeX error:', e);
            return `<code>$$${tex}$$ (Error)</code>`;
        }
    });

    // Process inline math: $...$
    result = result.replace(/\$([^$]+)\$/g, (_, tex) => {
        try {
            if (k) return k.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
            return `<code>$${tex}$</code>`;
        } catch (e) {
            console.error('KaTeX error:', e);
            return `<code>$${tex}$ (Error)</code>`;
        }
    });

    // Process bold: **text** or __text__
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Process italic: *text* or _text_
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Process inline code: `code`
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Process links: [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Process strikethrough: ~~text~~
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    return result;
}

export function RichContentNode({ node, graph: graphProp }: RichContentNodeProps) {
    // Get graph from prop OR fallback to node's model graph (X6 internal structure)
    const graph = graphProp || ((node as any)?.model?.graph);

    const containerRef = useRef<HTMLDivElement>(null);
    const [, forceUpdate] = useState(0);
    const [hasChildren, setHasChildren] = useState(false);

    if (!node) {
        return <div style={{ color: 'red', border: '2px solid red' }}>NO NODE</div>;
    }

    // Read markdownEnabled from localStorage instead of context
    // (RichContentNode is rendered outside the React tree by X6, so it can't access context)
    const markdownEnabled = (() => {
        try {
            const stored = localStorage.getItem('drawdd-markdown-enabled');
            return stored === null ? true : stored === 'true'; // Default: true
        } catch {
            return true; // Fallback if localStorage is not available
        }
    })();

    // Get current values from node
    const data = node?.getData() || {};
    const isMindmap = data.isMindmap === true;
    const isCollapsed = data.collapsed === true;

    // Get styling from attributes (rich-content-node doesn't use SVG body automatically)
    const bodyAttrs = node?.getAttrByPath('body') as any || {};
    const fill = bodyAttrs.fill || '#ffffff';
    const stroke = bodyAttrs.stroke || '#333333';
    const strokeWidth = bodyAttrs.strokeWidth || 2;
    const rx = bodyAttrs.rx || 6;

    // Get text color from label attrs or data
    const labelAttrs = node?.getAttrByPath('label') as any || {};
    const textColor = labelAttrs.fill || data.textColor || '#333333';

    // Get the CURRENT label text (robust check)
    // X6 can store text in: attrs.label.text, attrs.text.text, or just label (if string)
    let labelText = '';

    // 1. Check getAttrByPath('label/text')
    const attrLabelText = node?.getAttrByPath('label/text');
    if (typeof attrLabelText === 'string') labelText = attrLabelText;

    // 2. Check getAttrByPath('text/text')
    if (!labelText) {
        const attrTextText = node?.getAttrByPath('text/text');
        if (typeof attrTextText === 'string') labelText = attrTextText;
    }

    // 3. Check data.text
    if (!labelText && data.text) {
        labelText = data.text;
    }

    // 4. Check data.htmlContent as fallback
    if (!labelText && data.htmlContent) {
        // Strip HTML tags if using as source text for reprocessing
        labelText = data.htmlContent.replace(/<[^>]*>/g, '');
    }

    // Determine node type from folder explorer metadata
    // Requirements 1.15: Exclude markdown rendering for linked folder nodes
    const folderExplorer = data.folderExplorer;
    let nodeType: 'standard' | 'linked-folder' | 'static-folder' = 'standard';
    if (folderExplorer?.isFolderExplorer) {
        nodeType = folderExplorer.explorerType === 'linked' ? 'linked-folder' : 'static-folder';
    }

    // Handle link clicks - open URLs in browser
    // Requirement 1.11: Make link-only nodes clickable
    const handleLinkClick = (url: string) => {
        // Open URL in default browser (Electron)
        if ((window as any).electronAPI?.openExternal) {
            (window as any).electronAPI.openExternal(url);
        } else {
            // Fallback for web version
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // Handle image clicks - open full-size in new window
    // Requirement 1.14: Open full-size image when clicked
    const handleImageClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Handle collapse toggle click
    const handleCollapseToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!node || !graph) return;

        // Toggle collapsed state
        const newCollapsed = !isCollapsed;
        const currentData = node.getData() || {};
        node.setData({ ...currentData, collapsed: newCollapsed });

        // Emit custom event for Canvas.tsx to handle visibility
        graph.trigger('node:collapse-toggle', { node, collapsed: newCollapsed });

        forceUpdate(n => n + 1);
    };

    // Listen for node changes to re-render
    useEffect(() => {
        if (!node) return;

        const handleChange = () => {
            forceUpdate(n => n + 1);
        };

        // Listen for attribute changes
        node.on('change:attrs', handleChange);
        node.on('change:data', handleChange);

        return () => {
            node.off('change:attrs', handleChange);
            node.off('change:data', handleChange);
        };
    }, [node]);

    // Check for children when graph/node changes
    useEffect(() => {
        if (!node || !graph || !isMindmap) {
            setHasChildren(false);
            return;
        }

        // Check if this node has children (outgoing edges)
        // Use node.id to ensure we get the correct edges
        const checkChildren = () => {
            try {
                // Get the actual node from graph to ensure we have the latest state
                const currentNode = graph.getCellById(node.id);
                if (!currentNode || !currentNode.isNode()) {
                    setHasChildren(false);
                    return;
                }
                const outgoingEdges = graph.getOutgoingEdges(currentNode);
                // Filter to only count visible edges (not hidden by parent collapse)
                const visibleChildren = (outgoingEdges || []).filter((edge: any) => {
                    const target = edge.getTargetCell();
                    return target && target.isNode();
                });
                setHasChildren(visibleChildren.length > 0);
            } catch {
                setHasChildren(false);
            }
        };

        checkChildren();

        // Re-check when edges change - check if change affects this node
        const handleEdgeAdded = ({ edge }: { edge: any }) => {
            // Check both source and target as the edge might affect this node either way
            const sourceId = edge.getSourceCellId?.() || edge.source?.cell;
            const targetId = edge.getTargetCellId?.() || edge.target?.cell;
            if (sourceId === node.id || targetId === node.id) {
                setTimeout(checkChildren, 10);
            }
        };

        const handleEdgeRemoved = ({ edge }: { edge: any }) => {
            // When edge is removed, we need to check if this node was the source
            // The edge object should still have its source/target info at this point
            const sourceId = edge.getSourceCellId?.() || edge.source?.cell;
            const targetId = edge.getTargetCellId?.() || edge.target?.cell;
            if (sourceId === node.id || targetId === node.id) {
                setTimeout(checkChildren, 10);
            }
        };

        // Also listen for edge:connected which fires when edge source/target changes
        const handleEdgeConnected = ({ edge }: { edge: any }) => {
            const sourceId = edge.getSourceCellId?.() || edge.source?.cell;
            const targetId = edge.getTargetCellId?.() || edge.target?.cell;
            if (sourceId === node.id || targetId === node.id) {
                setTimeout(checkChildren, 10);
            }
        };

        graph.on('edge:added', handleEdgeAdded);
        graph.on('edge:removed', handleEdgeRemoved);
        graph.on('edge:connected', handleEdgeConnected);

        return () => {
            graph.off('edge:added', handleEdgeAdded);
            graph.off('edge:removed', handleEdgeRemoved);
            graph.off('edge:connected', handleEdgeConnected);
        };
    }, [node, graph, isMindmap]);

    // Show collapse indicator only for mindmap nodes with children
    const showCollapseIndicator = isMindmap && hasChildren;

    return (
        <div
            ref={containerRef}
            className="rich-content-node"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 8px',
                paddingRight: showCollapseIndicator ? '20px' : '8px', // Make room for collapse button
                boxSizing: 'border-box',
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: textColor,
                backgroundColor: fill,
                border: `${strokeWidth}px solid ${stroke}`,
                borderRadius: `${rx}px`,
                overflow: 'hidden',
                textAlign: 'center',
                wordBreak: 'break-word',
                lineHeight: 1.4,
                position: 'relative', // For absolute positioning of collapse button
                // Fix resolution/blurriness in foreignObject
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                transform: 'translateZ(0)', // Force GPU layer for crisp rendering
                backfaceVisibility: 'hidden',
            }}
        >
            <MarkdownRenderer
                text={labelText}
                enabled={markdownEnabled}
                nodeType={nodeType}
                onLinkClick={handleLinkClick}
                onImageClick={handleImageClick}
            />

            {/* Collapse/Expand Button */}
            {showCollapseIndicator && (
                <button
                    onClick={handleCollapseToggle}
                    style={{
                        position: 'absolute',
                        right: '2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '1px solid #94a3b8',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        lineHeight: 1,
                    }}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? '+' : '−'}
                </button>
            )}
        </div>
    );
}

// Plain text fallback component
export function PlainTextNode({ node }: RichContentNodeProps) {
    const data = node?.getData() || {};
    const text = data.text || '';
    const textColor = data.textColor || '#333333';
    const size = node?.getSize() || { width: 120, height: 40 };

    return (
        <div
            style={{
                width: size.width,
                height: size.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 8px',
                boxSizing: 'border-box',
                fontSize: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: textColor,
                overflow: 'hidden',
                textAlign: 'center',
                wordBreak: 'break-word',
            }}
        >
            {text}
        </div>
    );
}
