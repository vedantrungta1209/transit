const { withProjectBuildGradle } = require('@expo/config-plugins');

// Adds Razorpay's Maven repository to the Android project build.gradle.
// Required because com.razorpay artifacts are hosted on Razorpay's own Maven
// repo, not Maven Central — causing Gradle to fail to resolve the dependency.
//
// RN 0.74+ changed the top-level build.gradle structure, so we inject
// into the `allprojects { repositories {` block rather than looking for JitPack.
const withRazorpayMaven = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const RAZORPAY_MAVEN = "maven { url 'https://maven.razorpay.com/releases' }";

    if (contents.includes('maven.razorpay.com')) {
      return config; // already patched
    }

    // Strategy 1: inject after JitPack (RN < 0.74 style)
    if (contents.includes("maven { url 'https://www.jitpack.io' }")) {
      config.modResults.contents = contents.replace(
        "maven { url 'https://www.jitpack.io' }",
        `maven { url 'https://www.jitpack.io' }\n        ${RAZORPAY_MAVEN}`
      );
      return config;
    }

    // Strategy 2: inject after google() in allprojects block (RN 0.74+ style)
    const allprojectsMatch = contents.match(/(allprojects\s*\{[\s\S]*?repositories\s*\{)/);
    if (allprojectsMatch) {
      config.modResults.contents = contents.replace(
        allprojectsMatch[0],
        `${allprojectsMatch[0]}\n        ${RAZORPAY_MAVEN}`
      );
      return config;
    }

    // Strategy 3: append a top-level allprojects block if none exists
    config.modResults.contents =
      contents +
      `\nallprojects {\n    repositories {\n        ${RAZORPAY_MAVEN}\n    }\n}\n`;

    return config;
  });
};

module.exports = withRazorpayMaven;
