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

    const output = Babel.transform(code, {
      presets,
      filename: language === 'typescript' ? 'App.tsx' : 'App.jsx',
    }).code;

    return output || '';
  } catch (e: any) {
    console.error('Transpilation error:', e);
    // Return code that throws the error in the browser so it's visible
    return `throw new Error(${JSON.stringify(e.message)});`;
  }
};
