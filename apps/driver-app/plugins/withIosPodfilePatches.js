const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Applies four iOS-specific patches that can't be done via normal config plugins:
//
// 1. .xcode.env.local — sets BUNDLE_COMMAND=export:embed and CLI_PATH so Xcode
//    uses `expo export:embed` instead of `react-native bundle`. Required for
//    expo-router in a monorepo where expo is hoisted to the workspace root rather
//    than the app's own node_modules (EAS Build doesn't auto-detect this).
//
// 2. react_native_pods.rb — adds :modular_headers => true to React-jsinspector so
//    Xcode 16 doesn't emit a "module not found" error for jsinspector-modern.
//
// 3. Podfile — removes :privacy_file_aggregation_enabled option injected by some
//    older pod versions that CocoaPods 1.15+ no longer accepts.
//
// 4. Podfile post_install — flattens OTHER_CFLAGS arrays (razorpay-pod ships
//    vendored XCFrameworks that confuse react_native_post_install), bumps any pod
//    with a deployment target below iOS 13.4, and silences GCC warnings in
//    react-native-razorpay which treats them as errors.

const withIosPodfilePatches = (config) =>
  withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosDir = config.modRequest.platformProjectRoot;

      // --- 1. .xcode.env.local: BUNDLE_COMMAND + CLI_PATH for expo-router ---
      // expo is hoisted to the monorepo root (two levels above apps/customer-app),
      // so Xcode build scripts can't find it via the app's own node_modules.
      const monorepoRoot = path.resolve(projectRoot, '../..');
      const cliCandidates = [
        path.join(monorepoRoot, 'node_modules/expo/bin/cli'),
        path.join(projectRoot, 'node_modules/expo/bin/cli'),
      ];
      const cliPath = cliCandidates.find(fs.existsSync) || cliCandidates[0];
      const xcodEnvLocal = path.join(iosDir, '.xcode.env.local');
      fs.writeFileSync(
        xcodEnvLocal,
        `export BUNDLE_COMMAND=export:embed\nexport CLI_PATH="${cliPath}"\n`
      );
      console.log(`✅ [withIosPodfilePatches] .xcode.env.local written (CLI_PATH=${cliPath})`);

      // --- 2. react_native_pods.rb: React-jsinspector modular_headers ---
      const rnPodsCandidates = [
        path.join(projectRoot, 'node_modules/react-native/scripts/react_native_pods.rb'),
        path.join(projectRoot, '../../node_modules/react-native/scripts/react_native_pods.rb'),
      ];
      const OLD_JSINSPECTOR = `  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector-modern"`;
      const NEW_JSINSPECTOR = `  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector-modern", :modular_headers => true`;
      for (const rbPath of rnPodsCandidates) {
        if (!fs.existsSync(rbPath)) continue;
        const content = fs.readFileSync(rbPath, 'utf-8');
        if (content.includes(OLD_JSINSPECTOR)) {
          fs.writeFileSync(rbPath, content.replace(OLD_JSINSPECTOR, NEW_JSINSPECTOR));
          console.log(`✅ [withIosPodfilePatches] React-jsinspector modular_headers patched`);
        }
        break;
      }

      // --- 2 & 3. Podfile patches ---
      const podfilePath = path.join(iosDir, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf-8');

      // Remove :privacy_file_aggregation_enabled (unsupported in CocoaPods 1.15+)
      podfile = podfile.replace(/,\s*\n\s*:privacy_file_aggregation_enabled\s*=>[^\n]*/g, '');

      // Inject post_install block fixes
      const POST_INSTALL_FIX = [
        '  installer.pods_project.targets.each do |t|',
        '    t.build_configurations.each do |c|',
        "      ['OTHER_CFLAGS', 'OTHER_CPLUSPLUSFLAGS'].each do |k|",
        "        c.build_settings[k] = c.build_settings[k].join(' ') if c.build_settings[k].is_a?(Array)",
        '      end',
        "      min = c.build_settings['IPHONEOS_DEPLOYMENT_TARGET']",
        "      c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4' if min.to_f < 13.4",
        "      if t.name == 'react-native-razorpay'",
        "        c.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'",
        '      end',
        '    end',
        '  end',
        '',
      ].join('\n');

      const MARKER = 'post_install do |installer|\n';
      if (podfile.includes(MARKER) && !podfile.includes(POST_INSTALL_FIX)) {
        podfile = podfile.replace(MARKER, MARKER + POST_INSTALL_FIX);
        console.log('✅ [withIosPodfilePatches] Podfile post_install patched');
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);

module.exports = withIosPodfilePatches;
