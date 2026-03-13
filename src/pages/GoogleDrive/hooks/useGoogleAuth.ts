import { useState, useEffect, useCallback } from 'react';
import envConfig from '../../../../config/envConfig';

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = envConfig.googleClientId;
const SCOPES = 'openid profile email https://www.googleapis.com/auth/drive';

const STORAGE_KEY = 'gd_session';

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

  const stored = loadSession();
  const [accessToken, setAccessToken] = useState<string | null>(stored?.accessToken ?? null);
  const [user, setUser] = useState<GoogleUser | null>(stored?.user ?? null);
  const [expiresAt, setExpiresAt] = useState<number>(stored?.expiresAt ?? 0);

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
            console.log('Google Auth Response:', response);
            if (response.access_token) {
              const newExpiresAt = Date.now() + Number(response.expires_in) * 1000;
              setAccessToken(response.access_token);
              setExpiresAt(newExpiresAt);
              fetchUserInfo(response.access_token, newExpiresAt);
            } else {
              console.error('No access token in response', response);
            }
          },
        });
        setTokenClient(client);
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchUserInfo = async (token: string, tokenExpiresAt: number) => {
    try {
      console.log('Fetching user info with token:', token.substring(0, 10) + '...');
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('User Info:', data);
        const userInfo: GoogleUser = {
          name: data.name,
          email: data.email,
          picture: data.picture,
        };
        setUser(userInfo);
        saveSession(token, tokenExpiresAt, userInfo);
      } else {
        console.error('Failed to fetch user info:', res.status, res.statusText);
        const errorText = await res.text();
        console.error('Error details:', errorText);
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
