import React, { Dispatch, useEffect, useRef, useState } from 'react';
import { SaveToDriveButton, LoadFromDriveButton } from '@/components/GoogleDrive/DriveButtons';
import { Button, Upload, Typography, Input, Tooltip, message } from 'antd'; // Import Ant Design components
import { Editor } from '@monaco-editor/react'; // Import Monaco Editor component
import {
  AlignLeftOutlined,
  ClearOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  CopyOutlined,
  LockOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UnlockOutlined,
  UploadOutlined,
} from '@ant-design/icons'; // Import icons
import styles from '../styles.less'; // Import CSS module
import { handleCopy } from '@/helpers';
import { extractSize, formatXML, loadSettings } from '../utils/helpers';
import { optimize } from 'svgo'; // Import SVG optimizer
import type * as monaco from 'monaco-editor';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useSetting } from '../hooks/useSetting';
import { handleEditorMount } from '../utils/editorMount';

const { Text } = Typography; // Destructure Text component from Typography

type Props = {
  svgCode: string;
  setSvgCode: (val: string) => void;
  setPreview: (val: string) => void;
  sizeInfo: { before: number; after?: number } | null;
  setSizeInfo: Dispatch<
    React.SetStateAction<{
      before: number;
      after?: number;
    } | null>
  >;
  svgSize: { width: string; height: string };
  setSvgSize: (size: any) => void;
  svgContainerRef: React.RefObject<HTMLDivElement>;
  handleUpload: (file: File) => boolean;
};

const EditorSection: React.FC<Props> = ({
  svgCode,
  setSvgCode,
  setPreview,
  sizeInfo,
  setSizeInfo,
  svgSize,
  setSvgSize,
  svgContainerRef,
  handleUpload,
}) => {
  // --- State variables ---
  const { darkMode } = useDarkMode();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });

  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const ratioRef = useRef<number | null>(null);

  const [rotation, setRotation] = useState(0);

  // Setting hook
  const { settings, setSettings } = useSetting();

  useEffect(() => {
    setSizeInfo((pev) => ({ ...pev, before: new Blob([svgCode]).size }));
  }, []);

  // Keep ratio updated whenever SVG size changes
  useEffect(() => {
    const w = parseFloat(svgSize.width);
    const h = parseFloat(svgSize.height);
    if (w && h && !isNaN(w) && !isNaN(h)) {
      ratioRef.current = w / h;
    }
  }, [svgSize.width, svgSize.height]);

  // Sync lock ratio with setting
  useEffect(() => {
    if (lockRatio !== settings.lockRatio) setSettings({ ...settings, lockRatio });
  }, [lockRatio]);

  // --- Optimize SVG using SVGO ---
  const handleOptimize = () => {
    if (!svgCode.trim()) {
      // Check if SVG code exists
      message.warning('No SVG code to optimize.');
      return;
    }
    try {
      const beforeSize = new Blob([svgCode]).size; // Get original size
      const result = optimize(svgCode, { multipass: true }); // Optimize SVG
      let optimized = result.data; // Get optimized code

      // Remove unnecessary whitespace
      optimized = optimized
        .replace(/\n+/g, '')
        .replace(/\r+/g, '')
        .replace(/\t+/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/> </g, '><')
        .trim();

      const afterSize = new Blob([optimized]).size; // Get optimized size
      setSvgCode(optimized); // Update SVG code
      setPreview(optimized); // Update preview
      setSizeInfo({ before: beforeSize, after: afterSize }); // Update size info

      const percent = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1); // Calculate reduction
      message.success(`SVG optimized! Reduced by ${percent}%`);
    } catch (err) {
      console.error(err);
      message.error('Failed to optimize SVG.');
    }
  };

  // --- Copy SVG code to clipboard ---
  const handleCopyCode = () => handleCopy(svgCode, 'Copied SVG code to clipboard!');

  // --- Clear SVG code and preview ---
  const handleClear = () => {
    setSvgCode(''); // Clear SVG code
    setPreview(''); // Clear preview
    setSizeInfo(null); // Clear size info
    setSvgSize({ width: '', height: '' }); // Clear detected size
  };

  // --- Debounced Resize ---
  const debouncedResize = (width: string, height: string) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (width && height) handleResize(width, height);
    }, 500); // waits 500ms after typing stops
  };

  // --- Resize SVG by updating width and height attributes ---
  const handleResize = (width: string, height: string) => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }

    if (!width || !height) {
      message.warning('Please enter both width and height.');
      return;
    }

    let updated = svgCode;

    // Match the <svg ...> tag
    const svgTagMatch = updated.match(/<svg[^>]*>/i);
    if (!svgTagMatch) {
      message.error('Invalid SVG.');
      return;
    }

    let svgTag = svgTagMatch[0];

    // Replace existing width/height or add them if missing
    if (/width=/.test(svgTag)) {
      svgTag = svgTag.replace(/width="[^"]*"/, `width="${width}"`);
    } else {
      svgTag = svgTag.replace('<svg', `<svg width="${width}"`);
    }

    if (/height=/.test(svgTag)) {
      svgTag = svgTag.replace(/height="[^"]*"/, `height="${height}"`);
    } else {
      svgTag = svgTag.replace('<svg', `<svg height="${height}"`);
    }

    // Replace old <svg> tag with updated one
    updated = updated.replace(/<svg[^>]*>/i, svgTag);

    setSvgCode(updated);
    setPreview(updated);
    message.success(`SVG resized to ${width} × ${height}`);
  };

  // --- Flip SVG horizontally ---
  const flipHorizontal = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }
    let updated = svgCode;

    // Insert or update transform attribute
    updated = updated.replace(/<svg([^>]*)>/, (match, attrs) => {
      if (attrs.includes('transform=')) {
        return `<svg${attrs.replace(/transform="([^"]*)"/, 'transform="scale(-1,1) $1"')}>`;
      } else {
        return `<svg${attrs} transform="scale(-1,1)">`;
      }
    });

    setSvgCode(updated);
    setPreview(updated);
    message.success('Flipped horizontally!');
  };

  // --- Flip SVG vertically ---
  const flipVertical = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }
    let updated = svgCode;

    updated = updated.replace(/<svg([^>]*)>/, (match, attrs) => {
      if (attrs.includes('transform=')) {
        return `<svg${attrs.replace(/transform="([^"]*)"/, 'transform="scale(1,-1) $1"')}>`;
      } else {
        return `<svg${attrs} transform="scale(1,-1)">`;
      }
    });

    setSvgCode(updated);
    setPreview(updated);
    message.success('Flipped vertically!');
  };

  // --- Prettify SVG code ---
  const prettifySVG = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG code to prettify.');
      return;
    }
    try {
      const settings = loadSettings();
      let code = svgCode;
      if (settings?.optimizeBeforePrettify) code = optimize(svgCode, { multipass: true }).data; // Optimize SVG
      const pretty = formatXML(code);
      setSvgCode(pretty);
      setPreview(pretty);
      extractSize(pretty, setSvgSize);
      setSizeInfo((pev) => ({ ...pev, before: new Blob([pretty]).size }));
      message.success('SVG prettified!');
    } catch (err) {
      console.error(err);
      message.error('Failed to prettify SVG.');
    }
  };

  // --- Size Change ---
  const handleSizeChange = (type: 'width' | 'height', value: string) => {
    setSvgSize((prev) => {
      const updated = { ...prev };
      const numValue = parseFloat(value);

      // Assign new value
      updated[type] = value;

      if (lockRatio && ratioRef.current && !isNaN(numValue) && numValue > 0) {
        if (type === 'width') {
          // Auto-correct height based on width
          updated.height = numValue / ratioRef.current;
        } else {
          // Auto-correct width based on height
          updated.width = numValue * ratioRef.current;
        }
      }

      // Trigger resize only if both are valid numbers
      const w = parseFloat(updated.width);
      const h = parseFloat(updated.height);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        debouncedResize(updated.width, updated.height);
      }

      return updated;
    });
  };

  // --- Rotate SVG by a delta (e.g. +90 or -90) while preserving any existing transform ---
  const handleRotate = (delta: number) => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }

    const newRotation = (((rotation + delta) % 360) + 360) % 360;
    setRotation(newRotation);

    const updated = svgCode.replace(/<svg([^>]*)>/, (match, attrs) => {
      const rotateToken = `rotate(${newRotation})`;
      if (/transform="[^"]*"/.test(attrs)) {
        // Update existing transform: replace an existing rotate() token, otherwise append rotate.
        return `<svg${attrs.replace(/transform="([^"]*)"/, (_m, t) => {
          const cleaned = t.replace(/\brotate\([^)]*\)/, '').trim();
          const combined = cleaned ? `${cleaned} ${rotateToken}` : rotateToken;
          return `transform="${combined.replace(/\s+/g, ' ')}"`;
        })}>`;
      }
      return `<svg${attrs} transform="${rotateToken}">`;
    });

    setSvgCode(updated);
    setPreview(updated);
    message.success(`Rotated ${delta > 0 ? '+' : ''}${delta}° → ${newRotation}°`);
  };

  const onMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor; // Store the editor instance for later use
    const callback = (action: string, data: any) => {
      if (action === 'position')
        setCursorPos({
          line: data.lineNumber,
          column: data.column,
        });
    };
    handleEditorMount(editor, svgContainerRef, callback);
  };

  return (
    <div className={styles.editorSection}>
      {/* Grouped toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Upload beforeUpload={handleUpload} showUploadList={false} accept=".svg">
            <Tooltip title="Upload SVG">
              <Button size="small" icon={<UploadOutlined />}>
                Upload
              </Button>
            </Tooltip>
          </Upload>
          <Tooltip title="Prettify SVG">
            <Button size="small" onClick={prettifySVG} icon={<AlignLeftOutlined />}>
              Prettify
            </Button>
          </Tooltip>
          <Tooltip title="Optimize with SVGO (minify)">
            <Button size="small" onClick={handleOptimize} icon={<ThunderboltOutlined />}>
              Optimize
            </Button>
          </Tooltip>
        </div>

        <div className={styles.toolbarGroup}>
          <SaveToDriveButton
            getContent={() => svgCode}
            fileName="image.svg"
            mimeType="image/svg+xml"
            buttonProps={{ size: 'small' }}
          />
          <LoadFromDriveButton
            onLoad={(content) => {
              if (!content.includes('<svg')) {
                message.error('Invalid SVG file');
                return;
              }
              setSvgCode(content);
              setPreview(content);
            }}
            accept={['image/svg+xml', 'text/plain']}
            buttonProps={{ size: 'small' }}
          />
        </div>

        <div className={styles.spacer} />

        <div className={styles.toolbarGroup}>
          <Tooltip title="Copy SVG code">
            <Button size="small" type="primary" onClick={handleCopyCode} icon={<CopyOutlined />}>
              Copy
            </Button>
          </Tooltip>
          <Tooltip title="Clear editor">
            <Button size="small" danger onClick={handleClear} icon={<ClearOutlined />} />
          </Tooltip>
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>
          <span className={styles.statusLabel}>Cursor</span>Ln {cursorPos.line}, Col{' '}
          {cursorPos.column}
        </span>
        {sizeInfo && (
          <span>
            <span className={styles.statusLabel}>Size</span>
            <b>{(sizeInfo.before / 1024).toFixed(2)} KB</b>
            {sizeInfo.after && (
              <>
                {' '}
                → <b>{(sizeInfo.after / 1024).toFixed(2)} KB</b> (
                {(((sizeInfo.before - sizeInfo.after) / sizeInfo.before) * 100).toFixed(1)}%
                smaller)
              </>
            )}
          </span>
        )}
      </div>

      {/* Editor */}
      <div className={styles.editorBox}>
        <Editor
          height="100%"
          defaultLanguage="xml"
          value={svgCode}
          onChange={(val) => {
            const code = val || '';
            setSvgCode(code);
            setPreview(code);
            extractSize(code, setSvgSize);
            setSizeInfo((pev) => ({ ...pev, before: new Blob([code]).size }));
          }}
          onMount={onMount}
          theme={darkMode ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            fontSize: 14,
            lineNumbersMinChars: 2,
            lineDecorationsWidth: 0,
            lineNumbers: 'on',
          }}
        />
      </div>

      {/* Resize / transform row */}
      <div className={styles.resizeRow}>
        <Text strong style={{ fontSize: 12, marginRight: 4 }}>
          Transform:
        </Text>
        <Tooltip title={lockRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
          <Button
            size="small"
            icon={lockRatio ? <LockOutlined /> : <UnlockOutlined />}
            type={lockRatio ? 'primary' : 'default'}
            onClick={() => setLockRatio((prev) => !prev)}
          />
        </Tooltip>
        <Input
          size="small"
          prefix={<ColumnWidthOutlined />}
          placeholder="W"
          style={{ width: 95 }}
          value={svgSize.width}
          onChange={(e) => handleSizeChange('width', e.target.value.trim())}
        />
        <span className={styles.dim}>×</span>
        <Input
          size="small"
          prefix={<ColumnHeightOutlined />}
          placeholder="H"
          style={{ width: 95 }}
          value={svgSize.height}
          onChange={(e) => handleSizeChange('height', e.target.value.trim())}
        />
        <Tooltip title="Flip horizontally">
          <Button size="small" onClick={flipHorizontal} icon={<SwapOutlined />} />
        </Tooltip>
        <Tooltip title="Flip vertically">
          <Button
            size="small"
            onClick={flipVertical}
            icon={<SwapOutlined style={{ transform: 'rotate(90deg)' }} />}
          />
        </Tooltip>
        <Tooltip title="Rotate 90° counter-clockwise">
          <Button size="small" icon={<RotateLeftOutlined />} onClick={() => handleRotate(-90)} />
        </Tooltip>
        <Tooltip title="Rotate 90° clockwise">
          <Button size="small" icon={<RotateRightOutlined />} onClick={() => handleRotate(90)} />
        </Tooltip>
      </div>
    </div>
  );
};

export default EditorSection;
