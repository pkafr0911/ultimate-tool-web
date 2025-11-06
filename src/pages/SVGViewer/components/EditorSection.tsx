import React, { useEffect, useRef, useState } from 'react';
import { Button, Upload, Space, Typography, Input, Tooltip, message } from 'antd'; // Import Ant Design components
import { Editor } from '@monaco-editor/react'; // Import Monaco Editor component
import {
  UploadOutlined,
  HighlightOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
  SwapOutlined,
  LockOutlined,
  UnlockOutlined,
  RotateRightOutlined,
} from '@ant-design/icons'; // Import icons
import styles from '../styles.less'; // Import CSS module
import { handleCopy } from '@/helpers';
import { extractSize, formatXML, handleEditorMount } from '../utils/helpers';
import { optimize } from 'svgo'; // Import SVG optimizer
import type * as monaco from 'monaco-editor';
import { useDarkMode } from '@/hooks/useDarkMode';

const { Text } = Typography; // Destructure Text component from Typography

type Props = {
  svgCode: string;
  setSvgCode: (val: string) => void;
  setPreview: (val: string) => void;
  sizeInfo: { before: number; after?: number } | null;
  setSizeInfo: (info: { before: number; after?: number } | null) => void;
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

  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const ratioRef = useRef<number | null>(null);

  const [rotation, setRotation] = useState(0);

  // Keep ratio updated whenever SVG size changes
  useEffect(() => {
    const w = parseFloat(svgSize.width);
    const h = parseFloat(svgSize.height);
    if (w && h && !isNaN(w) && !isNaN(h)) {
      ratioRef.current = w / h;
    }
  }, [svgSize.width, svgSize.height]);

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

    if (updated.includes('width=')) {
      updated = updated.replace(/width="[^"]*"/, `width="${width}"`);
    } else {
      updated = updated.replace('<svg', `<svg width="${width}"`);
    }

    if (updated.includes('height=')) {
      updated = updated.replace(/height="[^"]*"/, `height="${height}"`);
    } else {
      updated = updated.replace('<svg', `<svg height="${height}"`);
    }

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
      const pretty = formatXML(svgCode);
      setSvgCode(pretty);
      setPreview(pretty);
      extractSize(pretty, setSvgSize);
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

  // --- Rotate SVG by 90° ---
  const handleRotate = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }

    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);

    let updated = svgCode;
    updated = updated.replace(/<svg([^>]*)>/, (match, attrs) => {
      const transformValue = `rotate(${newRotation})`;
      if (attrs.includes('transform=')) {
        return `<svg${attrs.replace(/transform="([^"]*)"/, `transform="${transformValue}"`)}>`;
      } else {
        return `<svg${attrs} transform="${transformValue}">`;
      }
    });

    setSvgCode(updated);
    setPreview(updated);
    message.success(`Rotated SVG to ${newRotation}°!`);
  };

  const onMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor; // Store the editor instance for later use
    handleEditorMount(editor, svgContainerRef);
  };

  return (
    <div className={styles.editorSection}>
      <Space className={styles.topActions} style={{ marginTop: 12, marginBottom: 8 }} wrap>
        <Upload beforeUpload={handleUpload} showUploadList={false} accept=".svg">
          <Button icon={<UploadOutlined />}>Upload SVG</Button>
        </Upload>
        <Button onClick={prettifySVG} icon={<HighlightOutlined />}>
          Prettify
        </Button>
        <Button onClick={handleOptimize} icon={<CompressOutlined />}>
          Optimize
        </Button>
      </Space>

      {/* Show size info */}
      {sizeInfo && (
        <Text type="secondary" className="mb-2 block">
          Size: <b>{(sizeInfo.before / 1024).toFixed(2)} KB</b>
          {sizeInfo.after && (
            <>
              {' '}
              → <b>{(sizeInfo.after / 1024).toFixed(2)} KB</b> (
              {(((sizeInfo.before - sizeInfo.after) / sizeInfo.before) * 100).toFixed(1)}% smaller)
            </>
          )}
        </Text>
      )}

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

      {/* Editor actions */}
      <Space className={styles.actions} wrap>
        <Button type="primary" onClick={handleCopyCode} icon={<CopyOutlined />}>
          Copy
        </Button>
        <Button danger onClick={handleClear} icon={<DeleteOutlined />}>
          Clear
        </Button>
      </Space>
      {/* Resize controls */}
      <Space style={{ float: 'right', marginTop: 16 }}>
        <Text strong>Resize:</Text>
        {/* Lock Ratio Button */}
        <Tooltip title={lockRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
          <Button
            size="small"
            icon={lockRatio ? <LockOutlined /> : <UnlockOutlined />}
            type={lockRatio ? 'primary' : 'default'}
            onClick={() => setLockRatio((prev) => !prev)}
          />
        </Tooltip>
        {/*Size Input*/}
        <Input
          size="small"
          prefix={<CompressOutlined />}
          placeholder="W"
          style={{ width: 90 }}
          value={svgSize.width}
          onChange={(e) => handleSizeChange('width', e.target.value.trim())}
        />
        x
        <Input
          size="small"
          prefix={<CompressOutlined />}
          placeholder="H"
          style={{ width: 90 }}
          value={svgSize.height}
          onChange={(e) => handleSizeChange('height', e.target.value.trim())}
        />
        {/* Flip buttons */}
        <Tooltip title={'Flip H'}>
          <Button onClick={flipHorizontal} icon={<SwapOutlined />} />
        </Tooltip>
        <Tooltip title={'Flip V'}>
          <Button
            onClick={flipVertical}
            icon={<SwapOutlined style={{ transform: 'rotate(90deg)' }} />}
          />
        </Tooltip>
        <Tooltip title="Rotate 90°">
          <Button icon={<RotateRightOutlined />} onClick={handleRotate} />
        </Tooltip>
      </Space>
    </div>
  );
};

export default EditorSection;
