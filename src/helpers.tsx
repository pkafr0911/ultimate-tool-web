import React from 'react';

import { message } from 'antd';
import querystring from 'query-string';

import {
  AppstoreOutlined,
  ToolOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { MenuDataItem } from '@ant-design/pro-components';

export const menuDataRender = (menuData): MenuDataItem[] => {
  // Separate Welcome route
  const welcomeItem = menuData.find((item) => item.path === '/');
  const playgroundItem = menuData.find((item) => item.path === '/playground');
  const otherItems = menuData.filter(
    (item) => item.path && !['/', '/playground'].includes(item.path),
  );

  const utilityPaths = [
    '/qr',
    '/videowatch',
    '/epoch',
    '/regex',
    '/uuid',
    '/password',
    '/jwt',
    '/colorpicker',
  ];
  const randomizerPaths = ['/wheel-of-names', '/random'];
  const imageConverterPaths = ['/svg-viewer', '/image-to-svg', '/base64'];
  const docsPaths = ['/docs'];

  // Type guard to ensure r.path is string
  const utilityChildren = otherItems.filter(
    (r): r is { name?: string; path: string } =>
      r.path !== undefined && utilityPaths.includes(r.path),
  );

  const randomizerChildren = otherItems.filter(
    (r): r is { name?: string; path: string } =>
      r.path !== undefined && randomizerPaths.includes(r.path),
  );

  const imageConverterChildren = otherItems.filter(
    (r): r is { name?: string; path: string } =>
      r.path !== undefined && imageConverterPaths.includes(r.path),
  );

  const docsChildren = otherItems.filter(
    (r): r is { name?: string; path: string } => r.path !== undefined && docsPaths.includes(r.path),
  );

  const mapItem = (r: { name?: string; path: string }) => ({
    key: r.name || r.path,
    name: r.name ? r.name.charAt(0).toUpperCase() + r.name.slice(1) : r.path,
    path: r.path,
  });

  const groupedMenu = [
    welcomeItem
      ? { key: 'welcome', name: welcomeItem.name || 'Welcome', path: welcomeItem.path! }
      : null,
    utilityPaths.length
      ? {
          key: 'utility',
          name: 'Utility Tools',
          icon: <ToolOutlined />,
          children: utilityChildren.map(mapItem),
        }
      : null,
    randomizerPaths.length
      ? {
          key: 'randomizer',
          name: 'Randomizer',
          icon: '🎲',
          children: randomizerChildren.map(mapItem),
        }
      : null,
    imageConverterPaths.length
      ? {
          key: 'imageConverter',
          name: 'Image Converter',
          icon: <PictureOutlined />,
          children: imageConverterChildren.map(mapItem),
        }
      : null,
    playgroundItem
      ? {
          key: 'playground',
          name: 'Playground',
          icon: <AppstoreOutlined />,
          path: playgroundItem.path!,
        }
      : null,
    docsChildren.length
      ? {
          key: 'docs',
          name: 'Documentation',
          icon: <FileTextOutlined />,
          children: docsChildren.map(mapItem),
        }
      : null,
  ].filter(Boolean);

  return groupedMenu as MenuDataItem[];
};

//get curent params in url
export const getPrams = (ignore: string[] = []) => {
  const { ...res } = querystring.parse(location.search);
  const filtered = Object.keys(res)
    .filter((key) => !ignore.includes(key))
    .reduce((obj, key) => {
      obj[key] = res[key];
      return obj;
    }, {});

  return generateParams(filtered);
};

//obj ->> parmas
export const generateParams = (obj: any) => {
  if (Object.keys(obj).length > 0) {
    let result = '';
    Object.keys(obj).forEach((item) => {
      result += `&${item}=${obj[item]}`;
    });
    return result;
  }
  return '';
};

export const handleCopy = (content: string, noti?: string) => {
  const unsecuredCopyToClipboard = (item: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = item;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Unable to copy to clipboard', err);
      message.error('Unable to copy to clipboard');
    }
    document.body.removeChild(textArea);
  };
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(content);
  } else {
    unsecuredCopyToClipboard(content);
  }
  message.success(noti || `Copied: ${content}`);
};
