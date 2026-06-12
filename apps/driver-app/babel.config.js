// babel-preset-expo is at the monorepo root node_modules; expo-router is app-local.
// hasModule('expo-router') returns false from the preset's context, so the
// expo-router babel plugin (which replaces process.env.EXPO_ROUTER_APP_ROOT
// with a static string for require.context) is never added by the preset.
// We add it explicitly here so Metro can resolve require.context at bundle time.
const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [expoRouterBabelPlugin],
  };
};
