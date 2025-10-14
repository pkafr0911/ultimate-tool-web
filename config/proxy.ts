import defaultSettings from './defaultSettings';

/**
 * @name Proxy Configuration
 * @see In the production environment, the proxy cannot take effect,
 * so there is no configuration for the production environment.
 * -------------------------------
 * The proxy does not work in the production environment,
 * so there is no production environment configuration.
 * For details, please see:
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */

const { SERVE_ENV = 'dev' } = process.env;

export default {
  dev: {
    '/api': {
      target: defaultSettings.serveUrlMap[SERVE_ENV],
      changeOrigin: true,
    },
  },
};
