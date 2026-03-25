import { useState, useEffect, useCallback, useRef } from 'react';
import envConfig from '../../../../config/envConfig';

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = envConfig.googleClientId;
const SCOPES = 'openid profile email https://www.googleapis.com/auth/drive';

const STORAGE_KEY = 'gd_session';
// Refresh the token this many ms before it actually expires (5 minutes)
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

interface StoredSession {
  accessToken: string;
  expiresAt: number;
  user: GoogleUser;
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(token: string, expiresAt: number, user: GoogleUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: token, expiresAt, user }));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export const useGoogleAuth = () => {
  const [tokenClient, setTokenClient] = useState<any>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stored = loadSession();
  const [accessToken, setAccessToken] = useState<string | null>(stored?.accessToken ?? null);
  const [user, setUser] = useState<GoogleUser | null>(stored?.user ?? null);
  const [expiresAt, setExpiresAt] = useState<number>(stored?.expiresAt ?? 0);

  const scheduleRefresh = useCallback((tokenExpiresAt: number, client: any) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = tokenExpiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
    if (delay <= 0) return; // already close to expiry; do nothing (user will see expired state)
    refreshTimerRef.current = setTimeout(() => {
      // Silent refresh — no consent dialog if the user still has an active Google session
      client?.requestAccessToken({ prompt: '' });
    }, delay);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && CLIENT_ID) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.access_token) {
              const newExpiresAt = Date.now() + Number(response.expires_in) * 1000;
              setAccessToken(response.access_token);
              setExpiresAt(newExpiresAt);
              fetchUserInfo(response.access_token, newExpiresAt);
              scheduleRefresh(newExpiresAt, client);
            } else {
              console.error('No access token in response', response);
            }
          },
        });
        setTokenClient(client);

        // If we already have a valid stored session, schedule a refresh immediately
        const existing = loadSession();
        if (existing) {
          scheduleRefresh(existing.expiresAt, client);
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const fetchUserInfo = async (token: string, tokenExpiresAt: number) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const userInfo: GoogleUser = {
          name: data.name,
          email: data.email,
          picture: data.picture,
        };
        setUser(userInfo);
        saveSession(token, tokenExpiresAt, userInfo);
      } else {
        console.error('Failed to fetch user info:', res.status, res.statusText);
      }
    } catch (e) {
      console.error('Failed to fetch user info', e);
    }
  };

  const signIn = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  }, [tokenClient]);

  const signOut = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    clearSession();
    if (window.google && accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null);
        setUser(null);
      });
    } else {
      setAccessToken(null);
      setUser(null);
    }
  }, [accessToken]);

  return {
    user,
    isSignedIn: !!accessToken,
    accessToken,
    signIn,
    signOut,
  };
};
