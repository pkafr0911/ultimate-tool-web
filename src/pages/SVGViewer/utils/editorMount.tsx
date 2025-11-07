import { loadSettings } from './helpers';
import * as monaco from 'monaco-editor';
import { ViewerSettings } from '../constants';

export const handleEditorMount = (
  editor: monaco.editor.IStandaloneCodeEditor,
  svgContainerRef,
  callback?: (action: string, data: any) => void,
) => {
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
  const clear = (settings: ViewerSettings) => {
    // 🧹 Remove highlight overlay and tooltip if present
    if (lastHighlightedEl) {
      lastHighlightedEl.style.stroke = '';
      lastHighlightedEl.style.strokeWidth = '';

      const svg = lastHighlightedEl.ownerSVGElement;
      removeHighlight(svg);
      lastHighlightedEl = null;
    }
    lastTagFragment = null;
  };

  // Function to apply highlight styles
  const applyHighlight = (targetEl: SVGElement, settings: ViewerSettings) => {
    const svg = targetEl.ownerSVGElement;
    if (!svg) return;

    // ✅ Highlight border if enabled
    if (settings.highlightBorder) {
      // Apply highlight stroke to matched SVG element
      targetEl.style.stroke = '#1890ff';
      targetEl.style.strokeWidth = '3';
    }

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

    if (settings.highlightArea) {
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
      // overlay.setAttribute('stroke-width', '2');
      overlay.setAttribute('pointer-events', 'none');
      overlay.style.transition = 'all 0.15s ease';
      svg.appendChild(overlay); // 🪄 Add overlay to SVG
    }

    // 🏷️ Tooltip showing width × height
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tooltip.setAttribute('id', '__highlight_tooltip__');
    tooltip.setAttribute('x', (bbox.x + bbox.width + 5).toString());
    tooltip.setAttribute('y', (bbox.y + 15).toString());
    tooltip.setAttribute('fill', '#1890ff');
    tooltip.setAttribute('font-size', '12');
    tooltip.setAttribute('font-family', 'monospace');
    tooltip.setAttribute('pointer-events', 'none');
    tooltip.textContent = `W: ${bbox.width.toFixed(1)} H: ${bbox.height.toFixed(1)}`;
    svg.appendChild(tooltip); // 🪄 Add tooltip to SVG

    // 🔗 Track highlight
    lastHighlightedEl = targetEl;
  };

  editor.onDidChangeCursorPosition((e) => {
    const position = editor.getPosition();
    if (!position) return;

    if (callback) {
      callback('position', position);
    }
  });

  // 🖱️ Highlight based on cursor position in the code editor
  editor.onMouseMove((e) => {
    const settings = loadSettings();
    const code = editor.getValue();
    const position = e.target.position;
    if (!position) return;

    const model = editor.getModel();
    if (!model) return;

    const offset = model.getOffsetAt(position);
    const tagStart = code.lastIndexOf('<', offset);
    const tagEnd = code.indexOf('>', offset);

    if (tagStart === -1 || tagEnd === -1 || offset < tagStart || offset > tagEnd) {
      clear(settings);
      return;
    }

    // 🧩 Extract the tag block safely — include attributes across multiple lines
    const tagFragment = code
      .slice(tagStart, tagEnd + 1)
      .replace(/\s+/g, ' ')
      .trim();

    const match = tagFragment.match(/<([a-zA-Z][\w:-]*)\b([^>]*)>/i);
    if (!match) return;

    const tagName = match[1].toLowerCase();
    const attrString = match[2] || '';

    if (tagFragment === lastTagFragment && lastHighlightedEl) return;
    lastTagFragment = tagFragment;

    const container = svgContainerRef.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    const elements: Element[] = svg.querySelectorAll(tagName);
    if (!elements.length) {
      clear(settings);
      return;
    }

    const parseAttributes = (str: string): Record<string, string> => {
      const attrs: Record<string, string> = {};
      str.replace(/([\w:-]+)\s*=\s*(['"])(.*?)\2/g, (_, key, _q, value) => {
        attrs[key] = value.replace(/\s+/g, ' ').trim();
        return '';
      });
      return attrs;
    };

    const parsedAttr = parseAttributes(attrString);

    // 🧩 Try to find the closest visual match
    let targetEl: SVGElement | null = null;

    // First, try perfect attribute match
    // 🧩 Step 1: Try to find the element whose attributes exactly match the tag under the cursor
    targetEl = Array.from(elements).find((el) => {
      // Collect all attributes from the SVG element into a normalized key-value map
      const elAttrs: Record<string, string> = {};
      for (const { name, value } of Array.from(el.attributes)) {
        // Normalize internal whitespace (e.g., remove extra spaces or line breaks)
        elAttrs[name] = value.replace(/\s+/g, ' ').trim();
      }

      // ✅ Compare attributes:
      // - Every attribute (key-value pair) in the parsed tag must exist in the SVG element
      // - This ensures we’re matching the *exact* element that corresponds to the code cursor
      return Object.entries(parsedAttr).every(([k, v]) => elAttrs[k] === v);
    }) as SVGElement | null;

    // 🪄 Step 2: If no exact attribute match was found,
    // and there are multiple elements with the same tag name (e.g. multiple <path> tags)
    if (!targetEl && elements.length > 1) {
      // Get the current mouse Y position in the browser window
      const mouseY = e.event.browserEvent?.clientY || 0;

      // Calculate the screen position (bounding box) of each element
      // Then sort them by how close their top edge is to the mouse Y position
      const sorted = Array.from(elements)
        .map((el) => ({
          el,
          box: el.getBoundingClientRect(),
        }))
        .sort((a, b) => Math.abs(a.box.top - mouseY) - Math.abs(b.box.top - mouseY));

      // 🎯 Pick the element visually closest to the mouse position as the best candidate
      targetEl = sorted[0]?.el as SVGElement;
    }

    // 🩹 Step 3: If all else fails, just use the first matching element as fallback
    if (!targetEl) targetEl = elements[0] as SVGElement;

    // 🧹 Clear previous highlight
    if (lastHighlightedEl && lastHighlightedEl !== targetEl) {
      lastHighlightedEl.style.stroke = '';
      lastHighlightedEl.style.strokeWidth = '';
    }

    // ✨ Apply highlight
    applyHighlight(targetEl, settings);
  });

  // 🖱️ Clear highlight when mouse leaves editor
  editor.onMouseLeave(() => {
    const settings = loadSettings(); // 👈 Load user preferences
    clear(settings);
  });
};
