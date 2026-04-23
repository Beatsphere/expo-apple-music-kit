/**
 * Result of an Apple Music authorization request.
 */
export interface AppleMusicAuthResult {
  authorized: boolean;
  userToken?: string;
  error?: string;
}

/**
 * Current playback state from SystemMusicPlayer (iOS 16+).
 */
export interface PlaybackState {
  status: 'playing' | 'paused' | 'stopped' | 'interrupted' | 'unknown' | 'unsupported';
  track: {
    id: string | null;
    name: string | null;
    artistName: string | null;
    albumName: string | null;
    artworkUrl: string | null;
    durationMs: number | null;
  } | null;
}

/**
 * Apple Music track from the REST API.
 */
export interface AppleMusicTrack {
  id: string;
  type: string;
  href: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    durationInMillis: number;
    artwork?: {
      url: string;
      width: number;
      height: number;
    };
    genreNames?: string[];
    releaseDate?: string;
    isrc?: string;
  };
}

/**
 * Paginated response from the recently played API.
 */
export interface RecentlyPlayedResponse {
  data: AppleMusicTrack[];
  next?: string;
}

/**
 * Error from the Apple Music REST API.
 */
export interface AppleMusicError {
  code: string;
  message: string;
  status: number;
}

/**
 * Simplified track format.
 */
export interface SimplifiedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  artworkUrl: string | undefined;
  genres: string[];
}

/**
 * Authorization status values.
 */
export type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined' | 'restricted';
