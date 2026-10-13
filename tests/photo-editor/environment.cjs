// These tests exercise state and geometry; actual raster assertions run in Chrome.
// jsdom's optional native canvas module may be present without its native binary.
try {
  require('canvas');
} catch {
  require.cache[require.resolve('canvas')] = {
    id: require.resolve('canvas'),
    filename: require.resolve('canvas'),
    loaded: true,
    exports: {},
  };
}
module.exports = require('jest-environment-jsdom').TestEnvironment;
