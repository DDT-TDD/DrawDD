/**
 * Markmap-Compatible Markdown Parser for DRAWDD
 * Converts full markdown documents into mindmap hierarchies with rich formatting
 */

import katex from 'katex';

// ============ HIERARCHY PARSING ============

/**
 * Markmap node structure for building mindmap hierarchy
 */
export interface MarkmapNode {
    text: string;           // Display text (may contain markdown)
    htmlContent?: string;   // Rendered HTML for rich display
    level: number;          // Hierarchy level (0 = root)
    children: MarkmapNode[];
    metadata?: {
        link?: string;        // URL if this is a link
        image?: string;       // Image URL if present
        checkbox?: boolean;   // Checkbox state (true = checked)
        codeBlock?: { lang: string; code: string }; // Code block
        table?: string[][];   // Table rows/cells
    };
}

/**
 * Parse full markdown document into markmap hierarchy
 * Headers define hierarchy, lists and content become children
 */
export function parseMarkmapDocument(markdown: string): MarkmapNode[] {
    const lines = markdown.split(/\r?\n/);
    const root: MarkmapNode[] = [];
    const stack: { node: MarkmapNode; level: number }[] = [];

    let currentCodeBlock: { lang: string; lines: string[] } | null = null;
    let currentTable: string[][] = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Handle code blocks
        if (line.startsWith('```')) {
            if (currentCodeBlock) {
                // End code block - add to last node
                const codeNode: MarkmapNode = {
                    text: `\`${currentCodeBlock.lang || 'code'}\``,
                    level: (stack.length > 0 ? stack[stack.length - 1].level : -1) + 1,
                    children: [],
                    metadata: {
                        codeBlock: {
                            lang: currentCodeBlock.lang,
                            code: currentCodeBlock.lines.join('\n')
                        }
                    }
                };
                codeNode.htmlContent = renderCodeBlock(codeNode.metadata!.codeBlock!);
                addNodeToHierarchy(root, stack, codeNode);
                currentCodeBlock = null;
            } else {
                // Start code block
                currentCodeBlock = {
                    lang: line.slice(3).trim(),
                    lines: []
                };
            }
            continue;
        }

        if (currentCodeBlock) {
            currentCodeBlock.lines.push(line);
            continue;
        }

        // Handle tables
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            if (!inTable) {
                inTable = true;
                currentTable = [];
            }
            // Skip separator row
            if (!cells.every(c => /^[-:]+$/.test(c))) {
                currentTable.push(cells);
            }
            continue;
        } else if (inTable) {
            // End table
            const tableNode: MarkmapNode = {
                text: '📊 Table',
                level: (stack.length > 0 ? stack[stack.length - 1].level : -1) + 1,
                children: [],
                metadata: { table: currentTable }
            };
            tableNode.htmlContent = renderTable(currentTable);
            addNodeToHierarchy(root, stack, tableNode);
            currentTable = [];
            inTable = false;
        }

        // Skip empty lines
        if (!line.trim()) continue;

        // Handle headers
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            const level = headerMatch[1].length - 1; // # = 0, ## = 1, etc.
            const text = headerMatch[2].trim();

            const node: MarkmapNode = {
                text,
                htmlContent: renderInlineMarkdown(text),
                level,
                children: []
            };

            // Pop stack until we find parent level
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                root.push(node);
            } else {
                stack[stack.length - 1].node.children.push(node);
            }

            stack.push({ node, level });
            continue;
        }

        // Handle list items (unordered and ordered)
        const listMatch = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/);
        if (listMatch) {
            const indent = listMatch[1].length;
            const text = listMatch[3].trim();

            // Calculate level based on indent (2 spaces = 1 level)
            const indentLevel = Math.floor(indent / 2);
            const baseLevel = stack.length > 0 ? stack[stack.length - 1].level + 1 : 0;
            const level = baseLevel + indentLevel;

            const node: MarkmapNode = {
                text,
                htmlContent: renderInlineMarkdown(text),
                level,
                children: []
            };

            // Check for checkbox
            const checkboxMatch = text.match(/^\[([ xX])\]\s*(.*)$/);
            if (checkboxMatch) {
                node.metadata = { checkbox: checkboxMatch[1].toLowerCase() === 'x' };
                node.text = checkboxMatch[2];
                node.htmlContent = renderInlineMarkdown(checkboxMatch[2]);
            }

            // Check for image
            const imageMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            if (imageMatch) {
                node.metadata = { ...node.metadata, image: imageMatch[2] };
                node.text = imageMatch[1] || '🖼️ Image';
                node.htmlContent = `<img src="${imageMatch[2]}" alt="${imageMatch[1]}" style="max-width:100px;max-height:60px;"/>`;
            }

            addNodeToHierarchy(root, stack, node);
            continue;
        }

        // Handle standalone images
        const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageMatch) {
            const node: MarkmapNode = {
                text: imageMatch[1] || '🖼️ Image',
                htmlContent: `<img src="${imageMatch[2]}" alt="${imageMatch[1]}" style="max-width:100px;max-height:60px;"/>`,
                level: (stack.length > 0 ? stack[stack.length - 1].level : -1) + 1,
                children: [],
                metadata: { image: imageMatch[2] }
            };
            addNodeToHierarchy(root, stack, node);
            continue;
        }

        // Handle regular text lines (add as child of current header)
        if (line.trim() && !line.startsWith('<!--')) {
            const node: MarkmapNode = {
                text: line.trim(),
                htmlContent: renderInlineMarkdown(line.trim()),
                level: (stack.length > 0 ? stack[stack.length - 1].level : -1) + 1,
                children: []
            };
            addNodeToHierarchy(root, stack, node);
        }
    }

    return root;
}

/**
 * Add a node to the hierarchy based on its level
 */
function addNodeToHierarchy(
    root: MarkmapNode[],
    stack: { node: MarkmapNode; level: number }[],
    node: MarkmapNode
): void {
    if (stack.length === 0) {
        root.push(node);
    } else {
        // Add as child of current stack top
        stack[stack.length - 1].node.children.push(node);
    }
}

// ============ INLINE MARKDOWN RENDERING ============

/**
 * Render inline markdown to HTML
 * Supports: bold, italic, strikethrough, highlight, code, links, equations
 */
export function renderInlineMarkdown(text: string): string {
    let html = escapeHtml(text);

    // Process in order of specificity

    // KaTeX equations - $...$ and $$...$$
    html = html.replace(/\$\$([^$]+)\$\$/g, (_, eq) => {
        try {
            return katex.renderToString(unescapeHtml(eq), { throwOnError: false, displayMode: true });
        } catch { return `$$${eq}$$`; }
    });
    html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
        try {
            return katex.renderToString(unescapeHtml(eq), { throwOnError: false, displayMode: false });
        } catch { return `$${eq}$`; }
    });

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" style="color:#2196f3;text-decoration:underline;">$1</a>');

    // Bold + Italic: ***text*** or ___text___
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');

    // Bold: **text** or __text__
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough: ~~text~~
    html = html.replace(/~~([^~]+)~~/g, '<del style="text-decoration:line-through;">$1</del>');

    // Highlight: ==text==
    html = html.replace(/==([^=]+)==/g, '<mark style="background:#fff59d;padding:0 2px;">$1</mark>');

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g,
        '<code style="background:#f5f5f5;padding:2px 4px;border-radius:3px;font-family:monospace;font-size:0.9em;">$1</code>');

    return html;
}

/**
 * Render code block to HTML
 */
function renderCodeBlock(block: { lang: string; code: string }): string {
    const escapedCode = escapeHtml(block.code);
    return `<pre style="background:#1e1e1e;color:#d4d4d4;padding:8px;border-radius:4px;font-family:monospace;font-size:11px;overflow:auto;max-width:200px;"><code>${escapedCode}</code></pre>`;
}

/**
 * Render table to HTML
 */
function renderTable(rows: string[][]): string {
    if (rows.length === 0) return '';

    const header = rows[0];
    const body = rows.slice(1);

    let html = '<table style="border-collapse:collapse;font-size:10px;"><thead><tr>';
    header.forEach(cell => {
        html += `<th style="border:1px solid #ccc;padding:2px 4px;background:#f0f0f0;">${escapeHtml(cell)}</th>`;
    });
    html += '</tr></thead><tbody>';

    body.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td style="border:1px solid #ccc;padding:2px 4px;">${escapeHtml(cell)}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// ============ UTILITY FUNCTIONS ============

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function unescapeHtml(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

/**
 * Check if text looks like a markmap document (has headers)
 */
export function isMarkmapDocument(text: string): boolean {
    return /^#{1,6}\s+/m.test(text);
}

/**
 * Strip all markdown formatting for plain text
 */
export function stripMarkdown(text: string): string {
    return text
        .replace(/\$\$([^$]+)\$\$/g, '$1')
        .replace(/\$([^$]+)\$/g, '$1')
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/~~([^~]+)~~/g, '$1')
        .replace(/==([^=]+)==/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1 ');
}

/**
 * CSS styles needed for KaTeX rendering
 */
export const KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';

/**
 * Inject KaTeX CSS into document
 */
export function injectKatexCSS(): void {
    if (typeof document === 'undefined') return;

    const existingLink = document.querySelector(`link[href="${KATEX_CSS_URL}"]`);
    if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = KATEX_CSS_URL;
        document.head.appendChild(link);
    }
}

// Legacy exports for compatibility
export const parseMarkdown = renderInlineMarkdown;
export const markdownToHtml = renderInlineMarkdown;
export function hasMarkdown(text: string): boolean {
    return /(\*\*|__|`|\$|~~|==|\[.+\]\(.+\))/.test(text);
}
