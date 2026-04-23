// Native module
export {
  isAvailable,
  isAppleMusicAppInstalled,
  requestAuthorization,
  getUserToken,
  getAuthorizationStatus,
  getPlaybackState,
  signOut,
  debugToken,
  ExpoAppleMusicKitModule,
} from './native';

// REST API utilities
export {
  formatArtworkUrl,
  getRecentlyPlayedTracks,
  getAllRecentlyPlayedTracks,
  getRecentlyPlayedResources,
  getHeavyRotation,
  searchCatalog,
  getUserStorefront,
  simplifyTrack,
} from './api';

// Types
export type {
  AppleMusicAuthResult,
  PlaybackState,
  AppleMusicTrack,
  RecentlyPlayedResponse,
  AppleMusicError,
  SimplifiedTrack,
  AuthorizationStatus,
} from './types';
