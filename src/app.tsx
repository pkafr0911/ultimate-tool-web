import { Footer } from '@/components';

import UnauthorizedPage from '@/pages/403';
import { pages } from '@/constants';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { setLocale, history } from '@umijs/max';
import { isPlainObject } from 'lodash';
import defaultSettings from '../config/defaultSettings';
import DarkModeSwitch from './components/DarkModeSwitch';
import GlobalSearchBar from './components/GlobalSearchBar';
import './libs/iconfont';
import { errorConfig } from './requestErrorConfig';

// Color accent per category, used in the mega-menu icon badges
const pathColorMap: Record<string, string> = {
  '/playground': '#4353ff',
  '/utility/': '#ff718b',
  '/visual-tools/': '#c471f5',
  '/editor/': '#41b3ff',
  '/randomizer/': '#ffab40',
  '/game/': '#00c853',
  '/docs/': '#26a69a',
};

const getCategoryColor = (path: string): string => {
  for (const [prefix, color] of Object.entries(pathColorMap)) {
    if (path.startsWith(prefix)) return color;
  }
  return '#574b7e';
};

const isDev = process.env.NODE_ENV === 'development';

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: any;
  loading?: boolean;
  fetchUserInfo?: () => Promise<any | undefined>;
}> {
  setLocale('en-US', true); //remove when multi lang

  const fetchUserInfo = async () => {
    try {
      const msg = { data: { username: 'hehe' } };
      return msg.data;
    } catch (error) {}
    return undefined;
  };

  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// Layout configuration for ProLayout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    footerRender: () => <Footer />,
    bgLayoutImgList: [],
    menuHeaderRender: (logo, title, props) => (
      <div
        onClick={() => history.push('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        {logo}
        <span className="app-title">{title}</span>
        <span className="app-title-badge">✦</span>
      </div>
    ),
    rightContentRender: () => (
      <div className="header-right-content">
        <GlobalSearchBar />
        <div className="header-divider" />
        <DarkModeSwitch />
      </div>
    ),

    menuItemRender: (item, defaultDom) => {
      // Only apply custom render for sub-menu items (e.g. /utility/qr, not /playground)
      const isSubItem = item.path && item.path.split('/').filter(Boolean).length > 1;
      const page = pages.find((p) => p.path === item.path);
      if (!isSubItem || !page) return defaultDom;

      const color = getCategoryColor(page.path);
      const iconBg = color + '22'; // ~13% opacity
      const iconBorder = color + '44'; // ~27% opacity

      return (
        <div className="mega-menu-item">
          <div
            className="mega-menu-icon-wrap"
            style={
              {
                background: iconBg,
                boxShadow: `0 0 0 1px ${iconBorder}`,
                color,
              } as React.CSSProperties
            }
          >
            {page.icon}
          </div>
          <div className="mega-menu-name">{page.name}</div>
          <div className="mega-menu-desc">{page.desc}</div>
        </div>
      );
    },

    // Custom 403 page if necessary
    unAccessible: <UnauthorizedPage />,
    childrenRender: (children) => (
      <>
        {children}
        {isDev && (
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            settings={initialState?.settings}
            onSettingChange={(settings) => {
              setInitialState((preInitialState) => ({
                ...preInitialState,
                settings,
              }));
            }}
          />
        )}
      </>
    ),

    ...initialState?.settings,
  };
};
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["obj"] }] */
const nullValueFilter = (obj: Record<string, any>) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (isPlainObject(value)) {
      nullValueFilter(value);
    } else if ([null, undefined].includes(value)) {
      delete obj[key];
    }
  });
};
/**
 * Network request configuration, including error handling
 * Based on axios and ahooks useRequest for unified request and error handling
 * @doc https://umijs.org/docs/max/request#configuration
 */
export const request = {
  ...errorConfig,

  // Request interceptors
  // credentials: 'same-origin',
  requestInterceptors: [
    (url, options) => {
      const newOptions = { ...options };
      if (newOptions.data) {
        nullValueFilter(newOptions.data);
      }
      newOptions.headers = {
        ...options.headers,
      };
      return {
        url,
        options: { ...newOptions, interceptors: true },
      };
    },
  ],
  responseInterceptors: [
    async (res) => {
      if (!res.ok) {
        // NOTE: http code >= 400, using errorHandler
        return res;
      }

      const data = await res.json();
      const { code = -1 } = data as Res<any>;
      if (code !== 0) {
        // eslint-disable-next-line
        return Promise.reject({ response: res, data });
      }
      return data;
    },
  ],
};
