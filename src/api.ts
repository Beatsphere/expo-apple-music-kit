import type { AppleMusicTrack, AppleMusicError, RecentlyPlayedResponse, SimplifiedTrack } from './types';

const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';

function apiHeaders(developerToken: string, userToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${developerToken}`,
    'Content-Type': 'application/json',
  };
  if (userToken) {
    headers['Music-User-Token'] = userToken;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      code: 'API_ERROR',
      message: errorData.errors?.[0]?.detail || `Request failed with status ${response.status}`,
      status: response.status,
    } as AppleMusicError;
  }
  return response.json();
}

/**
 * Format an Apple Music artwork URL template with desired dimensions.
 * Replaces `{w}` and `{h}` placeholders.
 */
export function formatArtworkUrl(url: string | undefined, size: number = 300): string | undefined {
  if (!url) return undefined;
  return url.replace('{w}', String(size)).replace('{h}', String(size));
}

/**
 * Fetch recently played tracks.
 * @param limit Max 10 per request
 * @param offset Pagination offset
 */
export async function getRecentlyPlayedTracks(
  developerToken: string,
  userToken: string,
  limit: number = 10,
  offset: number = 0
): Promise<RecentlyPlayedResponse> {
  const url = `${APPLE_MUSIC_API_BASE}/me/recent/played/tracks?limit=${limit}&offset=${offset}`;
  const response = await fetch(url, { headers: apiHeaders(developerToken, userToken) });
  return handleResponse<RecentlyPlayedResponse>(response);
}

/**
 * Fetch all recently played tracks (up to 50).
 * Apple Music stores max 50 and returns max 10 per request.
 */
export async function getAllRecentlyPlayedTracks(
  developerToken: string,
  userToken: string
): Promise<AppleMusicTrack[]> {
  const allTracks: AppleMusicTrack[] = [];

  for (const offset of [0, 10, 20, 30, 40]) {
    try {
      const response = await getRecentlyPlayedTracks(developerToken, userToken, 10, offset);
      allTracks.push(...response.data);
      if (response.data.length < 10) break;
    } catch {
      break;
    }
  }

  return allTracks;
}

/**
 * Fetch recently played resources (albums, playlists, stations).
 */
export async function getRecentlyPlayedResources(
  developerToken: string,
  userToken: string,
  limit: number = 10
): Promise<any> {
  const url = `${APPLE_MUSIC_API_BASE}/me/recent/played?limit=${limit}`;
  const response = await fetch(url, { headers: apiHeaders(developerToken, userToken) });
  return handleResponse(response);
}

/**
 * Get heavy rotation (most played items).
 */
export async function getHeavyRotation(
  developerToken: string,
  userToken: string,
  limit: number = 10
): Promise<any> {
  const url = `${APPLE_MUSIC_API_BASE}/me/history/heavy-rotation?limit=${limit}`;
  const response = await fetch(url, { headers: apiHeaders(developerToken, userToken) });
  return handleResponse(response);
}

/**
 * Search the Apple Music catalog.
 */
export async function searchCatalog(
  developerToken: string,
  term: string,
  types: ('songs' | 'albums' | 'artists' | 'playlists')[] = ['songs'],
  storefront: string = 'us',
  limit: number = 10
): Promise<any> {
  const typesParam = types.join(',');
  const url = `${APPLE_MUSIC_API_BASE}/catalog/${storefront}/search?term=${encodeURIComponent(term)}&types=${typesParam}&limit=${limit}`;
  const response = await fetch(url, { headers: apiHeaders(developerToken) });
  return handleResponse(response);
}

/**
 * Get the user's storefront (country/region).
 * Defaults to 'us' if unavailable.
 */
export async function getUserStorefront(
  developerToken: string,
  userToken: string
): Promise<string> {
  try {
    const url = `${APPLE_MUSIC_API_BASE}/me/storefront`;
    const response = await fetch(url, { headers: apiHeaders(developerToken, userToken) });
    if (!response.ok) return 'us';
    const data = await response.json();
    return data.data?.[0]?.id || 'us';
  } catch {
    return 'us';
  }
}

/**
 * Transform an Apple Music API track into a simplified format.
 */
export function simplifyTrack(track: AppleMusicTrack): SimplifiedTrack {
  return {
    id: track.id,
    name: track.attributes.name,
    artist: track.attributes.artistName,
    album: track.attributes.albumName,
    duration: track.attributes.durationInMillis,
    artworkUrl: formatArtworkUrl(track.attributes.artwork?.url, 300),
    genres: track.attributes.genreNames || [],
  };
}
