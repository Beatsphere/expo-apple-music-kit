const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin for @beatsphere/expo-apple-music-kit.
 *
 * Configures:
 * - iOS: NSAppleMusicUsageDescription in Info.plist
 * - Android: Package visibility queries for Apple Music app
 *
 * @param {object} config - Expo config
 * @param {object} options - Plugin options
 * @param {string} [options.appleMusiceUsageDescription] - Custom usage description for iOS
 */
const withAppleMusicKit = (config, options = {}) => {
  // iOS: Add Info.plist entries
  config = withInfoPlist(config, (config) => {
    config.modResults.NSAppleMusicUsageDescription =
      options.appleMusicUsageDescription ||
      config.modResults.NSAppleMusicUsageDescription ||
      'This app needs access to Apple Music to show your listening activity.';

    return config;
  });

  // Android: Add queries for Apple Music package visibility (Android 11+)
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.queries) {
      manifest.queries = [];
    }

    let queriesTag = manifest.queries[0];
    if (!queriesTag) {
      queriesTag = {};
      manifest.queries.push(queriesTag);
    }

    if (!queriesTag.package) {
      queriesTag.package = [];
    }

    const hasPackage = queriesTag.package.some(
      (pkg) => pkg.$?.['android:name'] === 'com.apple.android.music'
    );

    if (!hasPackage) {
      queriesTag.package.push({ $: { 'android:name': 'com.apple.android.music' } });
    }

    return config;
  });

  return config;
};

module.exports = withAppleMusicKit;
