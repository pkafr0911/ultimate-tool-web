import { message } from 'antd';
import cssbeautify from 'cssbeautify';

import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import prettier from 'prettier/standalone';

const formatHTML = (html: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const formatNode = (node: Node, level = 0): string => {
      const indent = '  '.repeat(level);
      let formatted = '';
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) formatted += indent + text + '\n';
        return formatted;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        formatted += `${indent}<${tag}`;
        for (const attr of Array.from(el.attributes)) {
          formatted += ` ${attr.name}="${attr.value}"`;
        }
        formatted += '>';
        const childNodes = Array.from(el.childNodes);
        const hasChildren = childNodes.some(
          (child) => child.nodeType === Node.ELEMENT_NODE || child.textContent?.trim(),
        );
        if (hasChildren) formatted += '\n';
        for (const child of childNodes) formatted += formatNode(child, level + 1);
        if (hasChildren) formatted += indent;
        formatted += `</${tag}>\n`;
      }
      return formatted;
    };
    const bodyNodes = Array.from(doc.body.childNodes);
    return bodyNodes
      .map((node) => formatNode(node))
      .join('')
      .trim();
  } catch {
    return html;
  }
};

export const prettifyHTML = (htmlContent, setHtmlContent) => {
  if (!htmlContent.trim()) return message.warning('No HTML content to prettify.');
  setHtmlContent(formatHTML(htmlContent));
  message.success('HTML prettified!');
};

export const prettifyCSS = (cssContent, setCssContent) => {
  if (!cssContent.trim()) return message.warning('No CSS content to prettify.');
  try {
    const beautified = cssbeautify(cssContent, {
      indent: '  ',
      openbrace: 'end-of-line',
      autosemicolon: true,
    });
    setCssContent(beautified);
    message.success('CSS prettified!');
  } catch {
    message.error('Failed to prettify CSS.');
  }
};

export const prettifyJS = async (
  code: string,
  setCode: (val: string) => void,
  language: 'javascript' | 'typescript' = 'javascript',
) => {
  if (!code.trim()) {
    message.warning('No code content to prettify.');
    return;
  }

  try {
    const formatted = await prettier.format(code, {
      parser: language === 'typescript' ? 'babel-ts' : 'babel', // TSX uses babel-ts
      plugins: [babel, estree], // ⚡ must include parser plugin
      semi: true,
      singleQuote: true,
      tabWidth: 2,
    });

    setCode(formatted);
    message.success(`${language === 'typescript' ? 'TSX' : 'JS'} prettified!`);
  } catch (error) {
    console.error(error);
    message.error('Failed to prettify code.');
  }
};
