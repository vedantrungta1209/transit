const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Expo's transformer resolves EXPO_ROUTER_APP_ROOT via path.resolve() at bundle time.
// In the monorepo, react-native-xcode.sh does `cd $SRCROOT/..` before starting Metro,
// making any relative path resolve from the wrong directory. Force an absolute path here,
// before getDefaultConfig reads it, so Metro always finds the correct app/ directory.
if (!path.isAbsolute(process.env.EXPO_ROUTER_APP_ROOT || '')) {
  process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');
}

const config = getDefaultConfig(projectRoot);

// Without watchFolders, Metro resolves packages from the monorepo root via
// nodeModulesPaths but never applies Babel transforms to them. expo-router
// lives at transit/node_modules, so _ctx.ios.js's require.context call is
// never transformed and fails at runtime with "Invalid call".
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
