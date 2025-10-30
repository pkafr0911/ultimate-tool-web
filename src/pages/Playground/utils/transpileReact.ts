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
    return `document.body.innerHTML = '<pre style="color:red;white-space:pre-wrap;">${e.message}</pre>';`;
  }
};
