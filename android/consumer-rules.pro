# Keep the Expo module
-keep class expo.modules.applemusickit.** { *; }

# Keep Apple MusicKit SDK classes
-keep class com.apple.android.sdk.** { *; }
-keep class com.apple.android.music.** { *; }

# Keep native module registration
-keepclassmembers class * {
    @expo.modules.kotlin.modules.* <methods>;
}
