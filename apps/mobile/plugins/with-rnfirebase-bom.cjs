const { withProjectBuildGradle } = require("@expo/config-plugins");

const FIREBASE_BOM_VERSION = "33.16.0";
const MARKER = "// @jimpitan-rnfirebase-bom";

module.exports = function withReactNativeFirebaseBom(config) {
  return withProjectBuildGradle(config, (projectConfig) => {
    if (projectConfig.modResults.language !== "groovy") {
      throw new Error("Plugin Firebase BoM hanya mendukung build.gradle Groovy.");
    }

    if (!projectConfig.modResults.contents.includes(MARKER)) {
      const override = `\n${MARKER}\nproject.ext {\n  set('react-native', [\n    versions: [\n      firebase: [bom: \"${FIREBASE_BOM_VERSION}\"],\n    ],\n  ])\n}\n`;
      projectConfig.modResults.contents = projectConfig.modResults.contents.replace("\nallprojects {", `${override}\nallprojects {`);
    }

    return projectConfig;
  });
};
