const { withGradleProperties } = require("@expo/config-plugins");

const LOW_MEMORY_PROPERTIES = {
  "org.gradle.jvmargs": "-Xmx1536m -XX:MaxMetaspaceSize=384m -Dfile.encoding=UTF-8",
  "org.gradle.daemon": "false",
  "org.gradle.parallel": "false",
  "org.gradle.workers.max": "1",
  "kotlin.compiler.execution.strategy": "in-process",
};

module.exports = function withLowMemoryGradle(config) {
  return withGradleProperties(config, (gradleConfig) => {
    for (const [key, value] of Object.entries(LOW_MEMORY_PROPERTIES)) {
      const property = gradleConfig.modResults.find(
        (item) => item.type === "property" && item.key === key,
      );

      if (property) {
        property.value = value;
      } else {
        gradleConfig.modResults.push({ type: "property", key, value });
      }
    }

    return gradleConfig;
  });
};
