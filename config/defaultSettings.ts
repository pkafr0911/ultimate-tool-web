import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * Application settings configuration for Pro Layout
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
  serveUrlMap: {
    dev: string;
  };
  basePath: string;
  publicPath: string;
} = {
  navTheme: 'light', // Theme color of the navigation bar (light mode)
  colorPrimary: '#002e70', // Primary color for the theme (Dawn Blue)
  layout: 'mix', // Layout type (mixed layout with sidebar and top navigation)
  contentWidth: 'Fluid', // Fluid content width for responsiveness
  fixedHeader: false, // Whether to fix the header (false for a non-fixed header)
  fixSiderbar: true, // Whether to fix the sidebar (true to keep it fixed)
  colorWeak: false, // Whether to enable color weakness mode
  title: 'Ultimate tool', // Application title
  pwa: true, // Enable Progressive Web App (PWA) support
  logo: 'https://pkafr0911.github.io/ultimate-tool-web/qr_icon.png', // Path to the logo/favicon image
  iconfontUrl: '', // Custom icon font URL (empty for default)
  token: {
    // Token configuration for theme customization
    // See the official documentation for theme customization via token:
    // https://procomponents.ant.design/components/layout#%E9%80%9A%E8%BF%87-token-%E4%BF%AE%E6%94%B9%E6%A0%B7%E5%BC%8F
  },
  serveUrlMap: {
    dev: 'http://localhost:9080',
  },
  //// Deployment base path - decomment this when run yarn deploy
  basePath: '/ultimate-tool-web/',
  publicPath: '/ultimate-tool-web/',

  //// Dev base path
  // basePath: '/',
  // publicPath: '/',
};

export default Settings;
