import { LogoutOutlined, SettingOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import HeaderDropdown from '../HeaderDropdown';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  children?: React.ReactNode;
};

// Styling for the AvatarDropdown component
const useStyles = createStyles(({ token }) => {
  return {
    action: {
      display: 'flex',
      height: '48px',
      marginLeft: 'auto',
      overflow: 'hidden',
      alignItems: 'center',
      padding: '0 8px',
      cursor: 'pointer',
      borderRadius: token.borderRadius,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
  };
});

// AvatarDropdown component, which includes the user menu
export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ menu, children }) => {
  const { styles } = useStyles();
  const { initialState, setInitialState } = useModel('@@initialState');

  // Handle menu click events
  const onMenuClick: MenuProps['onClick'] = (event) => {
    const { key } = event;
    if (key === 'logout') {
      return;
    }
    if (key === 'change_password') {
      handleOpenResetPassword();
      return;
    }

    history.push(`/account/${key}`);
  };

  // Loading state (when initialState is undefined or loading)
  const loading = (
    <span className={styles.action}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  // If initialState or currentUser is not available, show loading spinner
  if (!initialState) {
    return loading;
  }

  //#region toggle active status
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);

  // Reset password
  const handleOpenResetPassword = () => {
    setResetPasswordModalVisible(true);
  };
  //#endregion

  // Define the menu items based on the presence of the "menu" prop
  const menuItems = [
    ...(menu
      ? [
          {
            key: 'center',
            icon: <UserOutlined />,
            label: 'User Center',
          },
          {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'User Settings',
          },
          {
            type: 'divider' as const,
          },
        ]
      : []),
    {
      key: 'change_password',
      icon: <UnlockOutlined />,
      label: 'Change password',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ];

  // Render the HeaderDropdown component with the user's menu
  return (
    <>
      <HeaderDropdown
        menu={{
          selectedKeys: [],
          onClick: onMenuClick,
          items: menuItems,
        }}
        overlay={undefined}
      >
        {children}
      </HeaderDropdown>
    </>
  );
};
