import * as monaco from 'monaco-editor';

// --- Download SVG or other data as file ---
export const handleDownload = (data: string, filename: string, type: string) => {
  const blob = new Blob([data], { type }); // Create a blob from data
  const link = document.createElement('a'); // Create an anchor element
  link.href = URL.createObjectURL(blob); // Set href to blob URL
  link.download = filename; // Set file name
  link.click(); // Trigger download
  URL.revokeObjectURL(link.href); // Clean up URL object
};

// --- Helper function to format XML ---
export const formatXML = (xml: string) => {
  xml = xml.replace(/>\s+</g, '><').replace(/\r|\n/g, '').trim(); // Remove whitespace between tags and newlines
  xml = xml.replace(/(>)(<)(\/*)/g, '$1\n$2$3'); // Add newline between tags
  const lines = xml.split('\n'); // Split XML into lines
  let indentLevel = 0; // Initialize indentation level
  const formattedLines: string[] = []; // Store formatted lines

  lines.forEach((line) => {
    if (line.match(/^<\/\w/)) indentLevel--; // Decrease indent for closing tags
    const padding = '  '.repeat(indentLevel); // Create padding string
    let formattedLine = padding + line.trim(); // Apply padding
    if (formattedLine.match(/^<\w.*\s+\w+=/)) {
      // If tag has attributes
      formattedLine = formattedLine.replace(/(\s+\w+=)/g, '\n' + padding + '  $1'); // Put each attribute on a new line
    }
    formattedLines.push(formattedLine); // Add formatted line to array
    if (line.match(/^<\w[^>]*[^/]>$/)) indentLevel++; // Increase indent for opening tag
  });

  return formattedLines.join('\n').trim(); // Join all lines
};

export const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor, svgContainerRef) => {
  let lastTagFragment: string | null = null; // Track the last highlighted tag name
  let lastHighlightedEl: SVGElement | null = null; // Track the last highlighted SVG element

  // Function to remove highlight overlay and tooltip
  const removeHighlight = (svg: SVGSVGElement | null) => {
    if (svg) {
      const oldOverlay = svg.querySelector('#__highlight_overlay__');
      const oldTooltip = svg.querySelector('#__highlight_tooltip__');
      if (oldOverlay) oldOverlay.remove();
      if (oldTooltip) oldTooltip.remove();
    }
  };

  // Function to clear highlight state
  const clear = () => {
    // 🧹 Remove highlight overlay and tooltip if present
    if (lastHighlightedEl) {
      const svg = lastHighlightedEl.ownerSVGElement;
      removeHighlight(svg);
      lastHighlightedEl = null;
    }
    lastTagFragment = null;
  };

  // Function to apply highlight styles
  const applyHighlight = (targetEl: SVGElement) => {
    const svg = targetEl.ownerSVGElement;
    if (!svg) return;

    // 🧹 Remove old highlight overlay if any
    removeHighlight(svg);

    // 🧩 Get the bounding box of the target element (use SVGGraphicsElement.getBBox when available)
    let bbox: { x: number; y: number; width: number; height: number };
    if ('getBBox' in targetEl && typeof (targetEl as any).getBBox === 'function') {
      try {
        // Cast to SVGGraphicsElement to satisfy TypeScript
        bbox = (targetEl as unknown as SVGGraphicsElement).getBBox();
      } catch (err) {
        // If getBBox throws (some browsers/elements), fall back to DOM rect
        const rect = (targetEl as Element).getBoundingClientRect();
        bbox = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }
    } else {
      // Fallback for elements without getBBox
      const rect = (targetEl as Element).getBoundingClientRect();
      bbox = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }

    // 🎨 Create overlay rect
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlay.setAttribute('id', '__highlight_overlay__');
    overlay.setAttribute('x', bbox.x.toString());
    overlay.setAttribute('y', bbox.y.toString());
    overlay.setAttribute('width', bbox.width.toString());
    overlay.setAttribute('height', bbox.height.toString());
    overlay.setAttribute('fill', '#1890ff');
    overlay.setAttribute('fill-opacity', '0.15');
    overlay.setAttribute('stroke', '#1890ff');
    overlay.setAttribute('stroke-width', '2');
    overlay.setAttribute('pointer-events', 'none');
    overlay.style.transition = 'all 0.15s ease';

    // 🏷️ Tooltip showing width × height
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tooltip.setAttribute('id', '__highlight_tooltip__');
    tooltip.setAttribute('x', (bbox.x + bbox.width + 5).toString());
    tooltip.setAttribute('y', (bbox.y + 15).toString());
    tooltip.setAttribute('fill', '#1890ff');
    tooltip.setAttribute('font-size', '14');
    tooltip.setAttribute('font-family', 'monospace');
    tooltip.setAttribute('pointer-events', 'none');
    tooltip.textContent = `W: ${bbox.width.toFixed(1)} H: ${bbox.height.toFixed(1)}`;

    // 🪄 Add overlay and tooltip to SVG
    svg.appendChild(overlay);
    svg.appendChild(tooltip);

    // 🔗 Track highlight
    lastHighlightedEl = targetEl;
  };

  // 🖱️ Highlight based on cursor position in the code editor
  editor.onMouseMove((e) => {
    const code = editor.getValue(); // Get current SVG code
    const position = e.target.position; // Get cursor position
    if (!position) return;

    const model = editor.getModel(); // Get Monaco editor model
    if (!model) return;

    const offset = model.getOffsetAt(position); // Convert cursor position to string index
    const tagStart = code.lastIndexOf('<', offset); // Find start of current tag
    const tagEnd = code.indexOf('>', offset); // Find end of current tag

    // If the cursor isn't inside any <tag>, clear highlight
    if (tagStart === -1 || tagEnd === -1 || offset < tagStart || offset > tagEnd) {
      clear();
      return;
    }

    const tagFragment = code.slice(tagStart, tagEnd + 1); // Extract tag text (e.g. <rect x="10" />)
    // const match = tagFragment.match(/<(path|rect|circle|polygon)\b([^>]*)>/i);
    const match = tagFragment.match(/<([a-zA-Z][\w:-]*)\b([^>]*)>/i); // Match ANY tag and capture name + attributes
    if (!match) return;

    const tagName = match[1].toLowerCase(); // e.g. "rect", "path", "circle"
    const attrString = match[2] || ''; // Capture all attributes as string

    if (tagFragment === lastTagFragment && lastHighlightedEl) return; // Skip if same tag as before
    lastTagFragment = tagFragment;

    const container = svgContainerRef.current; // Reference to SVG preview container
    if (!container) return;
    const svg = container.querySelector('svg'); // Find SVG inside the container
    if (!svg) return;

    const elements: Element[] = svg.querySelectorAll(tagName); // Select all SVG elements of that tag
    if (!elements.length) {
      clear();
      return;
    }

    // 🧩 Try to find the element whose attributes match most closely
    let targetEl: SVGElement | null = null;

    const normalizedAttr = attrString.replace(/\s*\/?\s*>?\s*$/, '').trim(); // Remove trailing "/" or ">"
    targetEl = Array.from(elements).find(
      (el) => el.outerHTML.replace(/\s+/g, ' ').includes(normalizedAttr), // Match by attribute substring
    ) as SVGElement | null;

    // fallback to the first if no match found
    if (!targetEl) targetEl = elements[0] as SVGElement;

    // Clear previous highlight
    if (lastHighlightedEl && lastHighlightedEl !== targetEl) {
      lastHighlightedEl.style.stroke = '';
      lastHighlightedEl.style.strokeWidth = '';
    }

    // Apply highlight to matched SVG element
    applyHighlight(targetEl);
  });

  // 🖱️ Clear highlight when mouse leaves editor
  editor.onMouseLeave(() => {
    clear();
  });
};
