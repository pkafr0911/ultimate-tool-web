import * as Babel from '@babel/standalone';

export const transpileCode = (code: string, language: 'typescript' | 'javascript') => {
  try {
    const presets =
      language === 'typescript'
        ? [
            ['env', { modules: false, targets: { esmodules: true } }],
            ['react', { runtime: 'classic' }],
            'typescript',
          ]
        : [
            ['env', { modules: false, targets: { esmodules: true } }],
            ['react', { runtime: 'classic' }],
          ];

    // Plugin to rewrite relative imports to 'playground-src/'
    const transformImports = {
      visitor: {
        ImportDeclaration(path: any) {
          const source = path.node.source.value;
          if (source.startsWith('./') || source.startsWith('../')) {
            path.node.source.value = 'playground-src/' + source.replace(/^(\.\/|\.\.\/)+/, '');
          }
        },
        ExportNamedDeclaration(path: any) {
          if (path.node.source) {
            const source = path.node.source.value;
            if (source.startsWith('./') || source.startsWith('../')) {
              path.node.source.value = 'playground-src/' + source.replace(/^(\.\/|\.\.\/)+/, '');
            }
          }
        },
        ExportAllDeclaration(path: any) {
          if (path.node.source) {
            const source = path.node.source.value;
            if (source.startsWith('./') || source.startsWith('../')) {
              path.node.source.value = 'playground-src/' + source.replace(/^(\.\/|\.\.\/)+/, '');
            }
          }
        },
      },
    };

    const output = Babel.transform(code, {
      presets,
      plugins: [transformImports],
      filename: language === 'typescript' ? 'App.tsx' : 'App.jsx',
    }).code;

    return output || '';
  } catch (e: any) {
    console.error('Transpilation error:', e);
    // Return code that throws the error in the browser so it's visible
    return `throw new Error(${JSON.stringify(e.message)});`;
  }
};
