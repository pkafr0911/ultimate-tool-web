import { useEffect } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { REACT_EXTRA_LIB } from '../constants';

/**
 * Hook: useMonacoSetup
 * --------------------
 * This hook configures the Monaco Editor to support:
 * - React + JSX syntax
 * - TypeScript compilation with modern settings (ESNext)
 * - Type safety and type inference for React components
 */
export const useMonacoSetup = () => {
  // Get the monaco editor instance
  const monaco = useMonaco();

  useEffect(() => {
    // If Monaco isn't ready yet, exit early
    if (!monaco) return;

    // Configure TypeScript compiler options used inside Monaco Editor
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX, // Enable JSX syntax with the modern React JSX transform
      jsxImportSource: 'react', // Tells TypeScript to use the "react" package for JSX types
      target: monaco.languages.typescript.ScriptTarget.ESNext, // Target modern JavaScript (ESNext)
      module: monaco.languages.typescript.ModuleKind.ESNext, // Use ESNext module syntax (`import/export`)
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs, // Resolve modules as if running in a Node.js environment
      allowSyntheticDefaultImports: true, // Allow importing modules without needing a default export
      esModuleInterop: true, // Makes `import React from "react"` work correctly in TypeScript
      strict: true, // Enable all strict type-checking options
      skipLibCheck: true, // Skip checking type definitions inside `node_modules` for faster performance
    });

    // Add extra type definitions for React (JSX, hooks, FC, etc.)
    // This ensures the editor recognizes React types even without installing `@types/react`
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      REACT_EXTRA_LIB, // The content of the type definitions
      'file:///node_modules/@types/react/index.d.ts', // Virtual file path (used internally by Monaco)
    );
  }, [monaco]); // Re-run setup if the Monaco instance changes
};
