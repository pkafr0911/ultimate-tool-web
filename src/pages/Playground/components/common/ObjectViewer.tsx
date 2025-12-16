import React, { useState } from 'react';
import { CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';

type Props = {
  data: any;
  name?: string;
  depth?: number;
};

const ObjectViewer: React.FC<Props> = ({ data, name, depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);

  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  const isEmpty = isObject && Object.keys(data).length === 0;

  if (!isObject) {
    let color = '#d19a66'; // string
    if (typeof data === 'number') color = '#b5cea8';
    if (typeof data === 'boolean') color = '#569cd6';
    if (data === null || data === undefined) color = '#569cd6';

    return (
      <span style={{ color }}>
        {name && <span style={{ color: '#9cdcfe' }}>{name}: </span>}
        {JSON.stringify(data)}
      </span>
    );
  }

  const keys = Object.keys(data);
  const preview = isArray ? `Array(${keys.length})` : `{...}`;

  return (
    <div style={{ marginLeft: depth * 14 }}>
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        onClick={() => !isEmpty && setExpanded(!expanded)}
      >
        {!isEmpty && (
          <span style={{ marginRight: 4, fontSize: 10 }}>
            {expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
          </span>
        )}
        {name && <span style={{ color: '#9cdcfe', marginRight: 4 }}>{name}: </span>}
        <span style={{ color: '#888' }}>{isArray ? '[' : '{'}</span>
        {!expanded && (
          <span style={{ color: '#888', margin: '0 4px', fontStyle: 'italic' }}>{preview}</span>
        )}
        {isEmpty && <span style={{ color: '#888' }}>{isArray ? ']' : '}'}</span>}
      </div>

      {expanded && (
        <div>
          {keys.map((key) => (
            <div key={key}>
              <ObjectViewer data={data[key]} name={key} depth={1} />
            </div>
          ))}
          <div style={{ color: '#888' }}>{isArray ? ']' : '}'}</div>
        </div>
      )}
    </div>
  );
};

export default ObjectViewer;
