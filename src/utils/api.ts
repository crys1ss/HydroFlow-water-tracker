import { DayRecord, UserProfile, UserSettings } from '../types';

export const API_BASE = '';

export interface AuthResponse {
  user: UserProfile;
  isNew?: boolean;
  data?: {
    settings?: UserSettings;
    history?: Record<string, DayRecord>;
  };
}

/**
 * Sign up with Email and Password
 */
export async function apiSignUp(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create account.');
  }
  return data;
}

/**
 * Sign in with Email and Password
 */
export async function apiSignIn(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sign in.');
  }
  return data;
}

/**
 * Sign in / Register with verified Google account
 */
export async function apiGoogleAuth(googleUser: {
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(googleUser),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Google authentication failed.');
  }
  return data;
}

/**
 * Update user nickname & avatar on server
 */
export async function apiUpdateProfile(
  userId: string,
  nickname: string,
  avatar?: string
): Promise<{ user: UserProfile }> {
  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, nickname, avatar }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update profile.');
  }
  return data;
}

/**
 * Sync hydration history & settings to the cloud
 */
export async function apiSyncData(
  userId: string,
  settings: UserSettings,
  history: Record<string, DayRecord>
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, settings, history }),
    });
  } catch {
    // Graceful offline fallback
  }
}

/**
 * Fetch latest user data from the cloud
 */
export async function apiFetchData(userId: string): Promise<{
  settings?: UserSettings;
  history?: Record<string, DayRecord>;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/api/sync/${userId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

/**
 * Trigger Real Google OAuth 2.0 / Google Identity Services Authentication
 */
export function triggerGoogleSignIn(
  onSuccess: (profile: { email: string; name?: string; picture?: string; sub?: string }) => void,
  onError: (errMsg: string) => void
) {
  if (typeof window === 'undefined') return;

  const clientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '1038234857418-g2aeevv8mfg84u130b05bve9vh46i53o.apps.googleusercontent.com'; // Standard default or custom

  const google = (window as any).google;

  if (google?.accounts?.oauth2) {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            onError(tokenResponse.error_description || tokenResponse.error);
            return;
          }

          try {
            // Fetch real user info from Google's official userinfo API endpoint
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!res.ok) {
              throw new Error('Could not fetch userinfo from Google');
            }

            const profile = await res.json();
            onSuccess({
              email: profile.email,
              name: profile.name || profile.given_name,
              picture: profile.picture,
              sub: profile.sub,
            });
          } catch (err: any) {
            onError('Failed to retrieve Google profile: ' + (err.message || 'Unknown error'));
          }
        },
        error_callback: (err: any) => {
          onError(err.message || 'Google Sign-In failed.');
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (err: any) {
      console.warn('GIS error:', err);
    }
  }

  // Fallback: If GIS script is not ready or popup blocked
  onError('Google Sign-In client is initializing. If popup was blocked, please allow popups or use Email sign in.');
}
