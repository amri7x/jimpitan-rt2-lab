const { getDefaultConfig } = require("expo/metro-config");
const Module = require("module");
const path = require("path");

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveNativeWindTailwind(request, parent, ...arguments_) {
  if (request === "tailwindcss" || request.startsWith("tailwindcss/")) {
    return resolveFilename.call(this, request, module);
  }

  return resolveFilename.call(this, request, parent, ...arguments_);
};

const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
const cssInteropRoot = path.dirname(
  require.resolve("react-native-css-interop/package.json", { paths: [path.dirname(require.resolve("nativewind/metro"))] }),
);
const workspaceNodeModules = path.resolve(__dirname, "../../node_modules");

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-css-interop": cssInteropRoot,
  react: path.join(workspaceNodeModules, "react"),
  "react-native": path.join(workspaceNodeModules, "react-native"),
  "react-native-reanimated": path.join(workspaceNodeModules, "react-native-reanimated"),
  "react-native-worklets": path.join(workspaceNodeModules, "react-native-worklets"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
