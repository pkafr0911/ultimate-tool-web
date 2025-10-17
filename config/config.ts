// https://umijs.org/config/
import { defineConfig } from '@umijs/max';
import { join } from 'path';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { REACT_APP_ENV = 'dev' } = process.env;

/**
 * @name Use Public Path
 * @description The base path when deployed. If the app is deployed in a subdirectory, this should be configured.
 * @doc https://umijs.org/docs/api/config#publicpath
 */

export default defineConfig({
  /**
   * @name Enable Hash Mode
   * @description Appends a hash suffix to the build artifacts, typically used for incremental deployments to avoid cache issues.
   * @doc https://umijs.org/docs/api/config#hash
   */
  hash: true,

  /**
   * @name Base Path
   * @description All routes will automatically be prefixed with /path
   * e.g., history.push('/welcome') → /path/welcome
   */
  base: defaultSettings.basePath,

  /**
   * @name Public Path
   * @description All static assets will be loaded from /path/
   */
  publicPath: defaultSettings.publicPath,

  /**
   * @name Compatibility Settings
   * @description Enables compatibility for IE11. However, this may require checking all dependencies for compatibility.
   * @doc https://umijs.org/docs/api/config#targets
   */
  // targets: {
  //   ie: 11,
  // },

  /**
   * @name Route Configuration
   * @description Configures the routing for your application. Files not included in the routing won't be compiled.
   * @doc https://umijs.org/docs/guides/routes
   */
  routes,

  /**
   * @name Theme Configuration
   * @description Defines the Less variables for custom theming.
   * @doc antd theme configuration https://ant.design/docs/react/customize-theme-cn
   * @doc Umi theme configuration https://umijs.org/docs/api/config#theme
   */
  theme: {
    'root-entry-name': 'variable', // Enables dynamic theme changes
  },

  /**
   * @name Moment Internationalization
   * @description Reduce JS bundle size by disabling moment.js localization if internationalization is not needed.
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: true,

  /**
   * @name Proxy Configuration
   * @description Proxy settings for development, allowing local requests to be forwarded to a backend server.
   * @see Proxy works only during local development; it won't work in production builds.
   * @doc Proxy Configuration https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[(REACT_APP_ENV as keyof typeof proxy) || 'dev'],

  /**
   * @name Fast Refresh
   * @description Enables hot reloading with state preservation during development.
   */
  fastRefresh: true,

  //============== Max Plugin Configurations ===============

  /**
   * @name Data Flow Plugin
   * @doc https://umijs.org/docs/max/data-flow
   */
  model: {},

  /**
   * @name Initial Global Data Flow
   * @description Defines global state for sharing data between plugins, e.g., user information, settings, etc.
   * @doc https://umijs.org/docs/max/data-flow#%E5%85%A8%E5%B1%80%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81
   */
  initialState: {},

  /**
   * @name Layout Plugin
   * @doc https://umijs.org/docs/max/layout-menu
   */
  title: defaultSettings.title,
  layout: {
    locale: true,
    ...defaultSettings,
  },

  /**
   * @name Moment2Dayjs Plugin
   * @description Replaces moment.js with day.js for better performance and smaller bundle size.
   * @doc https://umijs.org/docs/max/moment2dayjs
   */
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },

  /**
   * @name Internationalization Plugin
   * @doc https://umijs.org/docs/max/i18n
   */
  locale: {
    default: 'en-US',
    antd: true,
    baseNavigator: true, // Uses browser language if true
  },

  /**
   * @name Ant Design Plugin
   * @description Enables Ant Design with built-in Babel import plugin.
   * @doc https://umijs.org/docs/max/antd#antd
   */
  antd: {},

  /**
   * @name Request Configuration
   * @description Provides a unified way of handling network requests and errors using axios and useRequest from ahooks.
   * @doc https://umijs.org/docs/max/request
   */
  request: {},

  /**
   * @name Access Plugin
   * @description Controls access based on the initial state, enabling role-based or permission-based routing.
   * @doc https://umijs.org/docs/max/access
   */
  access: {},

  /**
   * @name Head Script Configuration
   * @description Allows additional scripts to be added in the <head> tag.
   */
  headScripts: [
    // Resolves white screen issue on first load
    { src: join(defaultSettings.publicPath, 'scripts/loading.js'), async: true },
    { src: join(defaultSettings.publicPath, 'scripts/env.js'), async: true },
  ],

  //================ Pro Plugin Configurations =================

  presets: ['umi-presets-pro'],

  /**
   * @name Mako Plugin
   * @description Enables Mako for rapid development.
   * @doc https://umijs.org/docs/api/config#mako
   */
  mako: {},

  esbuildMinifyIIFE: true,

  requestRecord: {},
});
