import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import { disable, enable, setFetchMethod } from 'darkreader';
import React, { useEffect, useState } from 'react';

// DarkReader needs fetch for CSS
setFetchMethod(window.fetch);

const DarkModeSwitch: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dark-mode') === 'true';
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('dark-mode', String(darkMode));
    if (darkMode) enable({ brightness: 100, contrast: 90, sepia: 10 });
    else disable();
  }, [darkMode]);

  useEffect(() => {
    if (darkMode) {
      enable({
        brightness: 150,
        contrast: 90,
        sepia: 10,
      });
    } else {
      disable();
    }
  }, [darkMode]);

  return (
    <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Switch
        checked={darkMode}
        checkedChildren={<MoonOutlined style={{ color: '#1890ff' }} />}
        unCheckedChildren={<SunOutlined style={{ color: '#ffc107' }} />}
        onChange={setDarkMode}
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
      />
    </Tooltip>
  );
};

export default DarkModeSwitch;
