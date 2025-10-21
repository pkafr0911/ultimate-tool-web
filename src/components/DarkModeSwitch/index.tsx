import { useDarkMode } from '@/hooks/useDarkMode';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import React from 'react';
import './styles.less';

const DarkModeSwitch: React.FC = () => {
  const { darkMode, setDarkMode } = useDarkMode();

  return (
    <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Switch
        checked={darkMode}
        checkedChildren={<MoonOutlined style={{ color: '#1890ff' }} />}
        unCheckedChildren={<SunOutlined style={{ color: '#fff' }} />}
        onChange={setDarkMode}
        className={darkMode ? 'dark' : 'light'}
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
      />
    </Tooltip>
  );
};

export default DarkModeSwitch;
