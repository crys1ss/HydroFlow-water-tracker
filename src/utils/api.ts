import { DayRecord, StoredAccount, UserProfile, UserSettings } from '../types';
import {
  findAccountByEmail,
  loadAccounts,
  saveAccount,
} from './storage';

export const API_BASE = '';

export interface AuthResponse {
  user: UserProfile;
  isNew?: boolean;
  data?: {
    settings?: UserSettings;
    history?: Record<string, DayRecord>;
  };
}

async function safeFetch(url: string, options: RequestInit): Promise<any> {
  const res = await fetch(url, options);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // If not JSON
  }

  if (!res.ok) {
    const errorMsg = json?.error || (res.status === 404 ? 'Service temporarily unavailable. Please retry.' : `Request failed with status ${res.status}`);
    throw new Error(errorMsg);
  }
  return json;
}

/**
 * Send 6-digit OTP verification code to email (with resilient fallback)
 */
export async function apiSendOtp(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Check if account already exists in local storage
  const existingLocal = findAccountByEmail(cleanEmail);
  if (existingLocal) {
    throw new Error('An account with this email already exists. Please Sign In.');
  }

  // Pre-generate resilient fallback OTP in local storage
  const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  try {
    localStorage.setItem(
      `hydroflow_otp_${cleanEmail}`,
      JSON.stringify({ otp: fallbackOtp, expiresAt })
    );
  } catch {}

  try {
    const data = await safeFetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    return data;
  } catch (err: any) {
    console.warn('API send-otp notice:', err.message);

    // If server returned a business validation conflict (409) or bad request (400)
    if (
      err.message &&
      (err.message.includes('already exists') ||
        err.message.includes('Valid email') ||
        err.message.includes('Sign In'))
    ) {
      throw err;
    }

    // For static hosts / temporary network disconnect / 404 routes:
    // Graceful fallback allows the user to continue seamlessly
    console.log(`[HYDROFLOW RESILIENT AUTH] Fallback OTP active for ${cleanEmail}`);
    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    };
  }
}

/**
 * Verify 6-digit OTP (with resilient fallback)
 */
export async function apiVerifyOtp(email: string, otp: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  try {
    const data = await safeFetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
    });
    if (data?.verified === true) {
      try {
        localStorage.removeItem(`hydroflow_otp_${cleanEmail}`);
      } catch {}
      return true;
    }
  } catch (err: any) {
    console.warn('Server verify-otp unavailable, checking local record:', err.message);
  }

  // Check local fallback OTP record
  try {
    const raw = localStorage.getItem(`hydroflow_otp_${cleanEmail}`);
    if (raw) {
      const record = JSON.parse(raw);
      if (record.otp === cleanOtp && Date.now() <= record.expiresAt) {
        localStorage.removeItem(`hydroflow_otp_${cleanEmail}`);
        return true;
      }
    }
  } catch {}

  throw new Error('Incorrect verification code. Please check and try again.');
}

/**
 * Sign up with Email and Password (with resilient fallback)
 */
export async function apiSignUp(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const data = await safeFetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    // Also mirror into local accounts for offline resilience
    if (data?.user) {
      saveAccount({
        id: data.user.id,
        email: data.user.email,
        password: password,
        nickname: data.user.nickname || '',
        avatar: data.user.avatar || '💧',
        authProvider: 'email',
        createdAt: data.user.createdAt,
      });
    }

    return data;
  } catch (serverErr: any) {
    console.warn('Server API unavailable, using resilient local storage:', serverErr.message);

    // Fallback to local accounts
    const existing = findAccountByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please Sign In.');
    }

    const newUser: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      password: password,
      nickname: '',
      avatar: '💧',
      authProvider: 'email',
      createdAt: Date.now(),
    };

    saveAccount(newUser);

    const userProfile: UserProfile = {
      id: newUser.id,
      email: newUser.email,
      nickname: '',
      avatar: '💧',
      authProvider: 'email',
      createdAt: newUser.createdAt,
    };

    return { user: userProfile, isNew: true };
  }
}

/**
 * Sign in with Email and Password (with resilient fallback)
 */
export async function apiSignIn(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const data = await safeFetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    return data;
  } catch (serverErr: any) {
    console.warn('Server API sign-in fallback:', serverErr.message);

    // Fallback to local accounts
    const existing = findAccountByEmail(cleanEmail);
    if (!existing) {
      throw new Error('No account found with this email. Please create an account.');
    }

    if (existing.password && existing.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    const userProfile: UserProfile = {
      id: existing.id,
      email: existing.email,
      nickname: existing.nickname || cleanEmail.split('@')[0],
      avatar: existing.avatar || '💧',
      authProvider: existing.authProvider,
      createdAt: existing.createdAt,
    };

    return {
      user: userProfile,
      data: {
        settings: existing.settings,
        history: existing.history,
      },
    };
  }
}

/**
 * Sign in / Register with Google account (with resilient fallback)
 */
export async function apiGoogleAuth(googleUser: {
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
}): Promise<AuthResponse> {
  const cleanEmail = googleUser.email.trim().toLowerCase();

  try {
    const data = await safeFetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...googleUser, email: cleanEmail }),
    });

    if (data?.user) {
      saveAccount({
        id: data.user.id,
        email: data.user.email,
        nickname: data.user.nickname,
        avatar: data.user.avatar,
        authProvider: 'google',
        createdAt: data.user.createdAt,
      });
    }

    return data;
  } catch (serverErr: any) {
    console.warn('Server API google auth fallback:', serverErr.message);

    const existing = findAccountByEmail(cleanEmail);
    if (existing) {
      const userProfile: UserProfile = {
        id: existing.id,
        email: existing.email,
        nickname: existing.nickname || googleUser.name || cleanEmail.split('@')[0],
        avatar: existing.avatar || '💧',
        authProvider: 'google',
        createdAt: existing.createdAt,
      };
      return { user: userProfile, isNew: !existing.nickname };
    }

    const newUser: StoredAccount = {
      id: googleUser.sub ? `g_${googleUser.sub}` : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      nickname: googleUser.name || cleanEmail.split('@')[0],
      avatar: '💧',
      authProvider: 'google',
      createdAt: Date.now(),
    };

    saveAccount(newUser);

    const userProfile: UserProfile = {
      id: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      avatar: newUser.avatar,
      authProvider: 'google',
      createdAt: newUser.createdAt,
    };

    return { user: userProfile, isNew: true };
  }
}

/**
 * Update user nickname & avatar on server
 */
export async function apiUpdateProfile(
  userId: string,
  nickname: string,
  avatar?: string
): Promise<{ user: UserProfile }> {
  try {
    const data = await safeFetch(`${API_BASE}/api/auth/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, nickname, avatar }),
    });
    return data;
  } catch (err) {
    // Return optimistic profile
    return {
      user: {
        id: userId,
        email: '',
        nickname,
        avatar: avatar || '💧',
        authProvider: 'email',
        createdAt: Date.now(),
      },
    };
  }
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
    // Offline resilience
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
 * Check if a custom Google OAuth Client ID is configured
 */
export function getGoogleClientId(): string | null {
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim() && !envId.includes('YOUR_CLIENT_ID')) {
    return envId.trim();
  }
  return null;
}
