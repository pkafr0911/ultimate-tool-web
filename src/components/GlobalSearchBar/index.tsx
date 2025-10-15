import React, { useMemo, useState } from 'react';
import { AutoComplete, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from '@umijs/max';

// Define available routes (can import dynamically later)
const routes = [
  { path: '/', name: 'Welcome' },
  { path: '/qr', name: 'QR Generator' },
  { path: '/videowatch', name: 'Video Watch' },
  { path: '/epoch', name: 'Epoch Converter' },
  { path: '/regex', name: 'Regex Tester' },
  { path: '/uuid', name: 'UUID Generator' },
  { path: '/password', name: 'Password Generator' },
  { path: '/base64', name: 'Image Base64 Converter' },
  { path: '/jwt', name: 'JWT Encrypt / Decrypt' },
  { path: '/colorpicker', name: 'Color Picker' },
  { path: '/docs', name: 'Docs' },
];

// highlight matched text inside label
const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'ig');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ color: '#ff4d4f', fontWeight: 600 }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const GlobalSearchBar: React.FC = () => {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const options = useMemo(() => {
    if (!value) return [];
    const lower = value.toLowerCase();

    return routes
      .filter((r) => r.name.toLowerCase().includes(lower))
      .map((r) => ({
        value: r.name,
        label: (
          <div>
            <div style={{ fontSize: 14 }}>{highlightMatch(r.name, value)}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{r.path}</div>
          </div>
        ),
      }));
  }, [value]);

  const onSelect = (routeName: string) => {
    const selected = routes.find((r) => r.name === routeName);
    if (selected) navigate(selected.path);
  };

  return (
    <AutoComplete
      style={{ width: 260 }}
      defaultActiveFirstOption
      options={options}
      onSelect={onSelect}
      onSearch={setValue}
      value={value}
    >
      <Input
        placeholder="Search tools..."
        prefix={<SearchOutlined />}
        allowClear
        style={{ borderRadius: 6 }}
      />
    </AutoComplete>
  );
};

export default GlobalSearchBar;
