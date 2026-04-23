# @beatsphere/expo-apple-music-kit

Expo native module for Apple MusicKit on iOS and Android. Battle-tested in [BeatSphere](https://beatsphere.live).

Provides:

- **Native authorization** — MusicKit dialog on iOS, OAuth on Android
- **Playback state** — currently playing track via SystemMusicPlayer (iOS 16+)
- **User token** — for Apple Music REST API requests
- **REST API utilities** — recently played, heavy rotation, catalog search, storefront
- **Expo config plugin** — auto-configures Info.plist and AndroidManifest

## Install

```bash
npm install @beatsphere/expo-apple-music-kit
```

Add the plugin to your `app.config.js`:

```js
export default {
  plugins: [
    '@beatsphere/expo-apple-music-kit',
    // Or with custom usage description:
    ['@beatsphere/expo-apple-music-kit', {
      appleMusicUsageDescription: 'MyApp needs access to Apple Music to show your listening activity.'
    }],
  ],
};
```

Run prebuild:

```bash
npx expo prebuild --clean
```

### Prerequisites

1. **Apple Developer Account** with MusicKit enabled
2. **Developer Token** — a JWT signed with your MusicKit private key ([Apple docs](https://developer.apple.com/documentation/applemusicapi/generating_developer_tokens))
3. **Android**: Download `MusickitAuthenticationRelease.aar` from [Apple's MusicKit Android page](https://developer.apple.com/musickit/android/) — this package ships a copy but you may need to update it

## Quick Start

### Authorization

```tsx
import {
  isAvailable,
  requestAuthorization,
  getUserToken,
} from '@beatsphere/expo-apple-music-kit';

async function authorize() {
  const available = await isAvailable();
  if (!available) {
    console.log('Apple Music not available');
    return;
  }

  // iOS: shows native dialog. Android: requires developer token.
  const result = await requestAuthorization(DEVELOPER_TOKEN);

  if (result.authorized) {
    // Get user token for API calls
    const userToken = await getUserToken(DEVELOPER_TOKEN);
    console.log('User token:', userToken);
  }
}
```

### Now Playing (iOS 16+)

```tsx
import { getPlaybackState } from '@beatsphere/expo-apple-music-kit';

const state = await getPlaybackState();

if (state.status === 'playing' && state.track) {
  console.log(`${state.track.name} by ${state.track.artistName}`);
  console.log(`Artwork: ${state.track.artworkUrl}`);
}
```

### Recently Played Tracks

```tsx
import {
  getRecentlyPlayedTracks,
  getAllRecentlyPlayedTracks,
  simplifyTrack,
  formatArtworkUrl,
} from '@beatsphere/expo-apple-music-kit';

// Single page (max 10)
const response = await getRecentlyPlayedTracks(DEVELOPER_TOKEN, userToken);

// All pages (up to 50)
const allTracks = await getAllRecentlyPlayedTracks(DEVELOPER_TOKEN, userToken);

// Simplified format
const simplified = allTracks.map(simplifyTrack);
// [{ id, name, artist, album, duration, artworkUrl, genres }]
```

### Catalog Search

```tsx
import { searchCatalog } from '@beatsphere/expo-apple-music-kit';

const results = await searchCatalog(
  DEVELOPER_TOKEN,
  'Daft Punk',
  ['songs', 'albums'],
  'us', // storefront
  10    // limit
);
```

### Heavy Rotation

```tsx
import { getHeavyRotation } from '@beatsphere/expo-apple-music-kit';

const rotation = await getHeavyRotation(DEVELOPER_TOKEN, userToken);
```

### User Storefront

```tsx
import { getUserStorefront } from '@beatsphere/expo-apple-music-kit';

const storefront = await getUserStorefront(DEVELOPER_TOKEN, userToken);
// 'us', 'gb', 'jp', etc.
```

## API Reference

### Native Module

| Function | Description |
|----------|-------------|
| `isAvailable()` | Check if MusicKit is available (iOS 15+ / Apple Music installed on Android) |
| `isAppleMusicAppInstalled()` | Check if Apple Music app is installed (Android) |
| `requestAuthorization(developerToken?)` | Request music access (native dialog on iOS, OAuth on Android) |
| `getUserToken(developerToken)` | Get Music User Token for API calls |
| `getAuthorizationStatus()` | Get current auth status |
| `getPlaybackState()` | Get current playback state + track info (iOS 16+) |
| `signOut()` | Clear stored auth state |
| `debugToken(token)` | Validate JWT format and expiration |

### REST API

| Function | Description |
|----------|-------------|
| `getRecentlyPlayedTracks(dev, user, limit?, offset?)` | Fetch recent tracks (max 10/page) |
| `getAllRecentlyPlayedTracks(dev, user)` | Fetch all recent tracks (up to 50) |
| `getRecentlyPlayedResources(dev, user, limit?)` | Fetch recent albums/playlists/stations |
| `getHeavyRotation(dev, user, limit?)` | Fetch most played items |
| `searchCatalog(dev, term, types?, storefront?, limit?)` | Search the catalog |
| `getUserStorefront(dev, user)` | Get user's country/region |
| `simplifyTrack(track)` | Transform API track to simple format |
| `formatArtworkUrl(url, size?)` | Replace `{w}`/`{h}` in artwork URL template |

## Platform Notes

### iOS
- **iOS 15+** required for MusicKit authorization
- **iOS 16+** required for `getPlaybackState()` (SystemMusicPlayer)
- On iOS < 16, `getPlaybackState()` returns `{ status: 'unsupported' }`
- Falls back to `SKCloudServiceController` for authorization on older iOS

### Android
- Requires the **Apple Music app** to be installed
- Uses Apple's official [MusicKit Android SDK](https://developer.apple.com/musickit/android/) for OAuth
- `getPlaybackState()` is not available on Android (returns `unsupported`)
- `getAuthorizationStatus()` always returns `notDetermined` (no persistent state)

## Developer Token

You need a developer token (JWT) to use Apple Music APIs. Generate one using:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Create a **MusicKit** key
3. Note your **Team ID** and **Key ID**
4. Generate a JWT signed with your private key (ES256 algorithm)

The token should have:
- `iss`: Your Team ID
- `iat`: Current timestamp
- `exp`: Expiration (max 6 months)
- `alg`: ES256
- `kid`: Your Key ID

## License

MIT
