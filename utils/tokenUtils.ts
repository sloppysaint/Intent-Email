// utils/tokenUtils.ts
import { clientLogger } from "@/lib/logger";

interface Account {
  _id: string;
  userId: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpires: number;
  createdAt: string;
  updatedAt: string;
}

export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      clientLogger.error("Token refresh failed", { status: response.status, statusText: response.statusText });
      return null;
    }

    const tokenData = await response.json();
    return tokenData;
  } catch (error) {
    clientLogger.error("Error refreshing token", error);
    return null;
  }
}

export async function getValidAccessToken(account: Account): Promise<string | null> {
  // Check if token is still valid (with 5 minute buffer)
  if (account.accessTokenExpires > Date.now() + 5 * 60 * 1000) {
    return account.accessToken;
  }

  // Token expired, try to refresh
  if (account.refreshToken) {
    const newTokenData = await refreshGoogleToken(account.refreshToken);
    
    if (newTokenData) {
      // Update account with new token
      const updatedAccount = {
        ...account,
        accessToken: newTokenData.access_token,
        accessTokenExpires: Date.now() + newTokenData.expires_in * 1000,
        refreshToken: newTokenData.refresh_token || account.refreshToken,
      };

      // Save updated token to database
      try {
        await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedAccount),
        });
      } catch (error) {
        clientLogger.error("Failed to save updated token", error);
      }

      return newTokenData.access_token;
    }
  }

  return null;
}

export function isTokenExpired(expiresAt: number): boolean {
  return expiresAt <= Date.now() + 5 * 60 * 1000; // 5 minute buffer
}