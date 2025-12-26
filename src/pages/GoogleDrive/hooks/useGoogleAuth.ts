import { useState, useEffect, useCallback } from 'react';
import envConfig from '../../../../config/envConfig';

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = envConfig.googleClientId;
const SCOPES =
  'openid profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export const useGoogleAuth = () => {
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);

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
              setAccessToken(response.access_token);
              const expiresIn = Number(response.expires_in);
              setExpiresAt(Date.now() + expiresIn * 1000);
              fetchUserInfo(response.access_token);
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

  const fetchUserInfo = async (token: string) => {
    try {
      console.log('Fetching user info with token:', token.substring(0, 10) + '...');
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('User Info:', data);
        setUser({
          name: data.name,
          email: data.email,
          picture: data.picture,
        });
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
