import * as monaco from 'monaco-editor';
import { defaultSettings, SETTINGS_KEY, ViewerSettings } from '../constants';

// --- Helpers for LocalStorage ---
export const saveSettings = (settings: ViewerSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): ViewerSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

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

// --- Extract width and height from SVG code ---
export const extractSize = (
  code: string,
  setSvgSize: (size: { width: string; height: string }) => void,
) => {
  // Match the opening <svg ...> tag
  const svgTagMatch = code.match(/<svg[^>]*>/i);
  if (!svgTagMatch) {
    setSvgSize({ width: '', height: '' });
    return;
  }

  const svgTag = svgTagMatch[0];

  // Extract width and height from the <svg> tag only
  const widthMatch = svgTag.match(/width="([^"]+)"/);
  const heightMatch = svgTag.match(/height="([^"]+)"/);

  setSvgSize({
    width: widthMatch ? widthMatch[1] : '',
    height: heightMatch ? heightMatch[1] : '',
  });
};

export const ensureSvgSize = (svg: string, width = 128, height = 128) => {
  // Match the <svg ...> tag only (even if there's XML header above)
  const svgTagMatch = svg.match(/<svg[^>]*>/i);
  if (!svgTagMatch) return svg; // Not a valid SVG

  const svgTag = svgTagMatch[0];

  // Check if width/height exist inside the <svg> tag only
  const hasWidth = /\bwidth\s*=/.test(svgTag);
  const hasHeight = /\bheight\s*=/.test(svgTag);

  // If both exist, return unchanged
  if (hasWidth && hasHeight) return svg;

  // Insert missing width/height before the closing '>'
  const updatedSvgTag = svgTag.replace(/>$/, ` width="${width}" height="${height}">`);

  // Replace the original <svg ...> tag with the updated one
  return svg.replace(svgTag, updatedSvgTag);
};
