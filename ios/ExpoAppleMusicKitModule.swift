import ExpoModulesCore
import StoreKit
import MusicKit

public class ExpoAppleMusicKitModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoAppleMusicKit")

        // Check if Apple Music is available
        AsyncFunction("isAvailable") { () -> Bool in
            if #available(iOS 15.0, *) {
                return true
            }
            return false
        }

        // Request authorization
        AsyncFunction("requestAuthorization") { (promise: Promise) in
            if #available(iOS 15.0, *) {
                Task {
                    do {
                        let status = await MusicAuthorization.request()
                        switch status {
                        case .authorized:
                            promise.resolve([
                                "authorized": true,
                                "userToken": nil as String?
                            ])
                        case .denied:
                            promise.resolve([
                                "authorized": false,
                                "error": "User denied access to Apple Music"
                            ])
                        case .notDetermined:
                            promise.resolve([
                                "authorized": false,
                                "error": "Authorization not determined"
                            ])
                        case .restricted:
                            promise.resolve([
                                "authorized": false,
                                "error": "Apple Music access is restricted"
                            ])
                        @unknown default:
                            promise.resolve([
                                "authorized": false,
                                "error": "Unknown authorization status"
                            ])
                        }
                    }
                }
            } else {
                // Fallback for iOS < 15
                SKCloudServiceController.requestAuthorization { status in
                    switch status {
                    case .authorized:
                        promise.resolve([
                            "authorized": true,
                            "userToken": nil as String?
                        ])
                    case .denied:
                        promise.resolve([
                            "authorized": false,
                            "error": "User denied access to Apple Music"
                        ])
                    case .notDetermined:
                        promise.resolve([
                            "authorized": false,
                            "error": "Authorization not determined"
                        ])
                    case .restricted:
                        promise.resolve([
                            "authorized": false,
                            "error": "Apple Music access is restricted"
                        ])
                    @unknown default:
                        promise.resolve([
                            "authorized": false,
                            "error": "Unknown authorization status"
                        ])
                    }
                }
            }
        }

        // Get user token for API calls
        AsyncFunction("getUserToken") { (developerToken: String, promise: Promise) in
            let controller = SKCloudServiceController()
            controller.requestUserToken(forDeveloperToken: developerToken) { userToken, error in
                if let error = error {
                    promise.reject("USER_TOKEN_ERROR", error.localizedDescription)
                    return
                }

                guard let userToken = userToken else {
                    promise.reject("USER_TOKEN_ERROR", "Failed to get user token")
                    return
                }

                promise.resolve(userToken)
            }
        }

        // Get authorization status
        AsyncFunction("getAuthorizationStatus") { () -> String in
            if #available(iOS 15.0, *) {
                let status = MusicAuthorization.currentStatus
                switch status {
                case .authorized:
                    return "authorized"
                case .denied:
                    return "denied"
                case .notDetermined:
                    return "notDetermined"
                case .restricted:
                    return "restricted"
                @unknown default:
                    return "notDetermined"
                }
            } else {
                let status = SKCloudServiceController.authorizationStatus()
                switch status {
                case .authorized:
                    return "authorized"
                case .denied:
                    return "denied"
                case .notDetermined:
                    return "notDetermined"
                case .restricted:
                    return "restricted"
                @unknown default:
                    return "notDetermined"
                }
            }
        }

        // Get current playback state from SystemMusicPlayer
        AsyncFunction("getPlaybackState") { () -> [String: Any?] in
            if #available(iOS 16.0, *) {
                let player = SystemMusicPlayer.shared
                let state = player.state

                let statusString: String
                switch state.playbackStatus {
                case .playing:
                    statusString = "playing"
                case .paused:
                    statusString = "paused"
                case .stopped:
                    statusString = "stopped"
                case .interrupted:
                    statusString = "interrupted"
                case .seekingForward:
                    statusString = "playing"
                case .seekingBackward:
                    statusString = "playing"
                @unknown default:
                    statusString = "unknown"
                }

                // Try to get the current entry (now playing track)
                var trackInfo: [String: Any?]? = nil
                if let currentEntry = player.queue.currentEntry {
                    var title: String? = nil
                    var artist: String? = nil
                    var albumName: String? = nil
                    var artworkUrl: String? = nil
                    var durationMs: Int? = nil
                    var trackId: String? = nil

                    title = currentEntry.title
                    trackId = "\(currentEntry.id)"

                    if case let .song(song) = currentEntry.item {
                        title = song.title
                        artist = song.artistName
                        albumName = song.albumTitle
                        durationMs = Int(song.duration ?? 0) * 1000
                        trackId = song.id.rawValue
                        if let artwork = song.artwork {
                            let url = artwork.url(width: 300, height: 300)
                            artworkUrl = url?.absoluteString
                        }
                    }

                    trackInfo = [
                        "id": trackId,
                        "name": title,
                        "artistName": artist,
                        "albumName": albumName,
                        "artworkUrl": artworkUrl,
                        "durationMs": durationMs
                    ]
                }

                return [
                    "status": statusString,
                    "track": trackInfo
                ]
            } else {
                return [
                    "status": "unsupported",
                    "track": nil
                ]
            }
        }

        // Sign out (clear any cached state)
        AsyncFunction("signOut") { () -> Void in
            // MusicKit doesn't have a sign-out method, but we can clear any local state
            // The user token will be invalidated server-side
        }
    }
}
