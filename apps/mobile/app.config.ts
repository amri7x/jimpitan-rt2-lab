import type { ExpoConfig } from "expo/config";

const firebaseEnvironment = process.env.EXPO_PUBLIC_FIREBASE_ENV ?? "unconfigured";
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;

const config: ExpoConfig = {
  name: "Jimpitan RT 02 Demo",
  slug: "jimpitan-rt02-demo",
  scheme: "jimpitan-rt02-demo",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  experiments: { typedRoutes: true },
  plugins: [
    "expo-router",
    "expo-dev-client",
    "@react-native-firebase/app",
    "./plugins/with-rnfirebase-bom",
    "./plugins/with-low-memory-gradle",
  ],
  android: {
    package: "id.jimpitan.rt2.lab",
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
  extra: { firebaseEnvironment },
};

export default config;
