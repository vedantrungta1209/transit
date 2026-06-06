const { withProjectBuildGradle } = require('@expo/config-plugins');

// Adds Razorpay's Maven repository to the Android project build.gradle.
// Required because com.razorpay artifacts are hosted on Razorpay's own Maven
// repo, not Maven Central — causing Gradle to fail to resolve the dependency.
const withRazorpayMaven = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('maven.razorpay.com')) {
      config.modResults.contents = contents.replace(
        "maven { url 'https://www.jitpack.io' }",
        "maven { url 'https://www.jitpack.io' }\n        maven { url 'https://maven.razorpay.com/releases' }"
      );
    }
    return config;
  });
};

module.exports = withRazorpayMaven;
