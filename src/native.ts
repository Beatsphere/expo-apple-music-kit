import { requireNativeModule } from 'expo-modules-core';
import type { AppleMusicAuthResult, PlaybackState, AuthorizationStatus } from './types';

let ExpoAppleMusicKitModule: any = null;

try {
  ExpoAppleMusicKitModule = requireNativeModule('ExpoAppleMusicKit');
} catch {
  // Native module not available (e.g. web, Expo Go)
}

/**
 * Check if Apple MusicKit is available on the device.
 * - iOS: true if iOS 15+
 * - Android: true if Apple Music app is installed
 */
export async function isAvailable(): Promise<boolean> {
  if (!ExpoAppleMusicKitModule) return false;
  return ExpoAppleMusicKitModule.isAvailable();
}

/**
 * Check if the Apple Music app is installed (Android only).
 * On iOS, always returns true.
 */
export async function isAppleMusicAppInstalled(): Promise<boolean> {
  if (!ExpoAppleMusicKitModule) return false;
  return ExpoAppleMusicKitModule.isAppleMusicAppInstalled?.() ?? true;
}

/**
 * Request authorization to access Apple Music.
 * - iOS: Shows the native MusicKit permission dialog
 * - Android: Launches the Apple Music OAuth flow (requires developer token)
 */
export async function requestAuthorization(developerToken?: string): Promise<AppleMusicAuthResult> {
  if (!ExpoAppleMusicKitModule) {
    return { authorized: false, error: 'Native module not available' };
  }
  if (developerToken) {
    return ExpoAppleMusicKitModule.requestAuthorization(developerToken);
  }
  return ExpoAppleMusicKitModule.requestAuthorization();
}

/**
 * Get a Music User Token for Apple Music API requests.
 * @param developerToken Your Apple Music developer JWT token
 * @returns The user token string
 */
export async function getUserToken(developerToken: string): Promise<string> {
  if (!ExpoAppleMusicKitModule) {
    throw new Error('Native module not available');
  }
  return ExpoAppleMusicKitModule.getUserToken(developerToken);
}

/**
 * Get the current authorization status.
 */
export async function getAuthorizationStatus(): Promise<AuthorizationStatus> {
  if (!ExpoAppleMusicKitModule) return 'notDetermined';
  return ExpoAppleMusicKitModule.getAuthorizationStatus();
}

/**
 * Get the current playback state from SystemMusicPlayer (iOS 16+).
 * Returns track info and playback status.
 *
 * On Android or iOS < 16, returns `{ status: 'unsupported', track: null }`.
 */
export async function getPlaybackState(): Promise<PlaybackState> {
  if (!ExpoAppleMusicKitModule?.getPlaybackState) {
    return { status: 'unsupported', track: null };
  }
  return ExpoAppleMusicKitModule.getPlaybackState();
}

/**
 * Sign out and clear any stored state.
 */
export async function signOut(): Promise<void> {
  if (!ExpoAppleMusicKitModule) return;
  return ExpoAppleMusicKitModule.signOut();
}

/**
 * Debug helper — validate a JWT token's format and expiration.
 */
export function debugToken(token: string): { valid: boolean; error?: string; payload?: any } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format — expected 3 parts' };
    }

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: `Token expired at ${new Date(payload.exp * 1000).toISOString()}`, payload };
    }

    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

export { ExpoAppleMusicKitModule };
