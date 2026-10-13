const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// This workspace's Next.js app uses a different React release. Resolve both
// React and its web renderer from the mobile workspace, including SSR imports.
// Otherwise hoisted Expo modules can mix two React dispatchers during export.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react" ||
    moduleName.startsWith("react/") ||
    moduleName === "react-dom" ||
    moduleName.startsWith("react-dom/")
  ) {
    const mobileModule = require.resolve(moduleName, { paths: [__dirname] });
    return context.resolveRequest(context, mobileModule, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
