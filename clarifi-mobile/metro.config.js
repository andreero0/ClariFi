const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom configuration to suppress React.Children.only errors
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
