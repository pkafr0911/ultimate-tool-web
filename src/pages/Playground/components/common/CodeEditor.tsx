import React from 'react';
import Editor, { EditorProps } from '@monaco-editor/react';
import { useMonacoOption } from '../../hooks/useMonacoOption';
import { useDarkMode } from '@/hooks/useDarkMode';

interface CodeEditorProps extends EditorProps {
  language: string;
  value: string;
  onChange?: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ language, value, onChange, options, ...rest }) => {
  const { darkMode } = useDarkMode();
  const { monacoOptions } = useMonacoOption();

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme={darkMode ? 'vs-dark' : 'light'}
      options={{
        ...monacoOptions,
        ...options,
      }}
      {...rest}
    />
  );
};

export default CodeEditor;
