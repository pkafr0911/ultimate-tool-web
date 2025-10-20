import { Footer } from '@/components';

import UnauthorizedPage from '@/pages/403';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { setLocale } from '@umijs/max';
import { isPlainObject } from 'lodash';
import defaultSettings from '../config/defaultSettings';
import GlobalSearchBar from './components/GlobalSearchBar';
import './libs/iconfont';
import { errorConfig } from './requestErrorConfig';
import DarkModeSwitch from './components/DarkModeSwitch';

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
    menuHeaderRender: undefined,
    rightContentRender: () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 16 }}>
        <DarkModeSwitch />
        <GlobalSearchBar />
        {/* <AvatarDropdown /> */}
      </div>
    ),
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
