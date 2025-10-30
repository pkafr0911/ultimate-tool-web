import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import Editor, { useMonaco } from '@monaco-editor/react';
import { prettifyJS } from '../utils/formatters';
import { FormatPainterOutlined, SettingOutlined } from '@ant-design/icons';
import { DEFAULT_REACT, REACT_EXTRA_LIB } from '../constants';
import { useMonacoOption } from '../hooks/useMonacoOption';
import { useDarkMode } from '@/hooks/useDarkMode';
import { transpileTSXCode } from '../utils/transpileReact';

// 🧱 Define the props accepted by this component
type Props = {
  onOpenSettings: () => void; // Callback fired when the settings button is clicked
};

// 📖 Destructure Title from Ant Design's Typography for easy usage
const { Title } = Typography;

// 🚀 Main React component for the playground
const ReactPlayground: React.FC<Props> = ({ onOpenSettings }) => {
  const { darkMode } = useDarkMode(); // Detect if user prefers dark mode
  const [code, setCode] = useState(DEFAULT_REACT); // The code currently in the editor (initially a default example)

  const { monacoOptions } = useMonacoOption(); // Get Monaco editor configuration (font size, minimap, etc.)
  const monaco = useMonaco(); // Access the Monaco editor instance

  // 🧠 Configure TypeScript compiler and React typings once Monaco is ready
  useEffect(() => {
    if (monaco) {
      // Set compiler options so Monaco knows how to compile TSX
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX, // Use new JSX transform
        jsxImportSource: 'react', // Import from React runtime
        target: monaco.languages.typescript.ScriptTarget.ESNext, // Modern JS output
        module: monaco.languages.typescript.ModuleKind.ESNext, // ES modules
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs, // Resolve like Node.js
        allowSyntheticDefaultImports: true, // Allow default imports
        esModuleInterop: true, // Support interop between CJS and ESM
        strict: true, // Strict type checking
        skipLibCheck: true, // Skip lib type checking for performance
      });

      // Add fake "@types/react" definitions to enable React types in Monaco
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_EXTRA_LIB,
        'file:///node_modules/@types/react/index.d.ts',
      );

      // Optional: turn on validation in editor (both semantic & syntax)
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
    }
  }, [monaco]); // Only run when Monaco becomes available

  // The generated HTML preview code
  // ⚙️ Transpile TypeScript/React code into runnable JS + render preview
  const preview = useMemo(() => {
    // Convert TSX → JS using Babel or TypeScript transpileModule
    const jsCode = transpileTSXCode(code);

    // Build full HTML preview to embed in iframe
    const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Live React Preview</title>
      <style>
        body { margin: 0; font-family: sans-serif; padding: 20px; }
      </style>
      <!-- Load React + ReactDOM (v18) from CDN -->
      <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    </head>
    <body>
      <div id="root"></div>
      <script type="module">
        window.addEventListener('DOMContentLoaded', () => {
          try {
            ${jsCode} // Execute the user's transpiled React code
          } catch (err) {
            // Display runtime errors in red text
            document.body.innerHTML = '<pre style="color:red;">' + err + '</pre>';
            console.error(err);
          }
        });
      <\/script>
    </body>
  </html>
  `;
    return html;
  }, [code]); // Re-run every time code changes

  return (
    <Card className="react-card" variant="borderless">
      {/* Toolbar section with action buttons */}
      <Space style={{ marginBottom: 16 }}>
        {/* Settings button */}
        <Button icon={<SettingOutlined />} onClick={onOpenSettings} />

        {/* Prettify (auto-format) code button */}
        <Button icon={<FormatPainterOutlined />} onClick={() => prettifyJS(code, setCode)}>
          Prettify
        </Button>
      </Space>

      {/* 📝 Monaco Editor component */}
      <Editor
        height="400px"
        language="typescript" // Enables TypeScript syntax
        value={code} // The editor's current value
        onChange={(val) => setCode(val || '')} // Update state on edit
        theme={darkMode ? 'vs-dark' : 'light'} // Switch theme based on dark mode
        options={monacoOptions} // Editor appearance and behavior
        path="file:///App.tsx" // Virtual file name (important for TS)
      />

      {/* 🧩 Live React preview section */}
      <div className="react-preview-pane" style={{ marginTop: 24 }}>
        <Title level={5}>Live React Preview</Title>

        {/* Render generated HTML inside an iframe */}
        <iframe
          title="react-preview"
          srcDoc={preview} // The generated HTML code
          sandbox="allow-scripts allow-same-origin" // Restrict iframe permissions
          className="react-preview"
          style={{
            width: '100%',
            height: '600px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fff',
          }}
        />
      </div>
    </Card>
  );
};

// 🚀 Export the component for use elsewhere
export default ReactPlayground;
