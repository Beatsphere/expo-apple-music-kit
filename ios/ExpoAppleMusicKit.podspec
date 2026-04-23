Pod::Spec.new do |s|
  s.name           = 'ExpoAppleMusicKit'
  s.version        = '0.1.0'
  s.summary        = 'Apple MusicKit integration for Expo'
  s.description    = 'Native Apple MusicKit module for React Native/Expo apps — authorization, playback state, and user token management.'
  s.author         = 'BeatSphere'
  s.homepage       = 'https://github.com/Beatsphere/expo-apple-music-kit'
  s.license        = 'MIT'
  s.platform       = :ios, '15.0'
  s.source         = { git: 'https://github.com/Beatsphere/expo-apple-music-kit.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "*.swift"
  s.frameworks = 'StoreKit', 'MusicKit'
end
