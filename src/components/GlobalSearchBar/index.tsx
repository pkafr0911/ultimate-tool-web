import { pages } from '@/consants';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from '@umijs/max';
import { AutoComplete, Input } from 'antd';
import React, { useMemo, useState } from 'react';

// highlight matched text inside label
const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'ig');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ color: '#002e70', fontWeight: 600 }}>
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

    return pages
      .filter((p) => p.name.toLowerCase().includes(lower))
      .map((p) => ({
        value: p.name,
        label: (
          <div>
            <div style={{ fontSize: 14 }}>{highlightMatch(p.name, value)}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{p.path}</div>
          </div>
        ),
      }));
  }, [value]);

  const onSelect = (routeName: string) => {
    const selected = pages.find((p) => p.name === routeName);
    if (selected) navigate(selected.path);
  };

  return (
    <AutoComplete
      defaultActiveFirstOption
      options={options}
      onSelect={onSelect}
      onSearch={setValue}
      value={value}
    >
      <Input
        size="large"
        placeholder="Search tools..."
        prefix={<SearchOutlined />}
        allowClear
        style={{ borderRadius: 6 }}
      />
    </AutoComplete>
  );
};

export default GlobalSearchBar;
