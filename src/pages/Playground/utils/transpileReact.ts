import * as Babel from '@babel/standalone';

export const transpileTSXCode = (code: string) => {
  try {
    const output = Babel.transform(code, {
      presets: [
        ['env', { modules: false, targets: { esmodules: true } }],
        ['react', { runtime: 'classic' }],
        'typescript',
      ],
      filename: 'index.tsx',
    }).code;

    return output || '';
  } catch (e: any) {
    return `
      document.body.innerHTML = '<pre style="color:red;white-space:pre-wrap;">${e.message}</pre>';
    `;
  }
};
