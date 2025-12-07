import { usePlaygroundState } from './usePlaygroundState';

export const useMonacoOption = () => {
  const [editorOptions, setEditorOptions] = usePlaygroundState('playground_editor_options', {
    minimap: true,
    wordWrap: true,
    fontSize: 14,
    lineNumbersMinChars: 2,
    lineDecorationsWidth: 0,
    lineNumbers: true,
  });

  const monacoOptions = {
    minimap: { enabled: editorOptions.minimap },
    wordWrap: editorOptions.wordWrap ? 'on' : ('off' as any),
    fontSize: editorOptions.fontSize,
    lineNumbersMinChars: editorOptions.lineNumbersMinChars,
    lineDecorationsWidth: editorOptions.lineDecorationsWidth,
    lineNumbers: editorOptions.lineNumbers ? 'on' : ('off' as any),
  };

  return { monacoOptions, setEditorOptions };
};
