import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import { AccountModel } from "@/models/Account";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          // Only prompt consent when explicitly needed (e.g., adding new accounts)
          // Remove the blanket "consent" to prevent constant re-authorization
          prompt: "consent select_account",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, account, user, trigger }) {
      // Handle account linking during sign-in
      if (account && user) {
        try {
          await connectToDatabase();
          const userEmail = user.email!;

          // Prevent duplicate processing
          if (token.processed) {
            return token;
          }

          // Find if this email already exists
          const existingAccount = await AccountModel.findOne({ email: userEmail });
          
          let primaryUserId: string;
          
          if (existingAccount) {
            // Use existing userId to maintain account grouping
            primaryUserId = existingAccount.userId;
            
            // If token already has different refresh token, it might be a re-auth
            // Only update if we have a new refresh token or if it's expired
            const shouldUpdate = !existingAccount.accessToken || 
                                 (account.refresh_token && account.refresh_token !== existingAccount.refreshToken) ||
                                 (existingAccount.accessTokenExpires && existingAccount.accessTokenExpires < Date.now());
                                 
            if (!shouldUpdate) {
              // Use existing token data to prevent unnecessary updates
              token.userId = primaryUserId;
              token.email = userEmail;
              token.accessToken = existingAccount.accessToken;
              token.refreshToken = existingAccount.refreshToken;
              token.accessTokenExpires = existingAccount.accessTokenExpires;
              token.processed = true;
              return token;
            }
          } else if (token.sub) {
            // For new accounts, check if we have other accounts for this user
            const existingUserAccounts = await AccountModel.find({ userId: token.sub });
            primaryUserId = existingUserAccounts.length > 0 ? existingUserAccounts[0].userId : token.sub;
          } else {
            // Fallback to user.id
            primaryUserId = user.id;
          }

          // Calculate expiration time more accurately
          const expiresAt = account.expires_at 
            ? account.expires_at * 1000 
            : Date.now() + (account.expires_in || 3600) * 1000;

          // Upsert the account only if necessary
          const savedAccount = await AccountModel.findOneAndUpdate(
            { email: userEmail },
            {
              $set: {
                userId: primaryUserId,
                email: userEmail,
                name: user.name || "",
                image: user.image,
                provider: account.provider,
                accessToken: account.access_token!,
                refreshToken: account.refresh_token || undefined,
                accessTokenExpires: expiresAt,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: new Date(),
              }
            },
            { upsert: true, new: true }
          );

          // Update token with account info
          token.userId = primaryUserId;
          token.email = userEmail;
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.accessTokenExpires = savedAccount.accessTokenExpires;
          token.processed = true;
          
        } catch (error) {
          console.error("Error saving account:", error);
          token.error = "account_save_error";
        }
      }

      // Check if token is expired and needs refresh
      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires - 5 * 60 * 1000) {
        token.shouldRefresh = true;
      }

      // Return token for existing sessions
      return token;
    },

    async session({ session, token }) {
      // Add custom properties to session
      if (token.userId) {
        (session as any).userId = token.userId;
      }
      if (token.email) {
        (session as any).email = token.email;
      }
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      if (token.error) {
        (session as any).error = token.error;
      }
      if (token.shouldRefresh) {
        (session as any).shouldRefresh = token.shouldRefresh;
      }
      
      return session;
    },
  },
  pages: { 
    signIn: "/",
    error: "/" 
  },
  events: {
    async signIn({ account, user, isNewUser }) {
      
      // Only set the flag for genuinely new accounts
      // This prevents the flag from being set on every sign-in
      if (isNewUser || account?.provider === "google") {
        // Note: This localStorage approach won't work server-side
        // You might want to use a different mechanism like a database flag
        // or handle this in the frontend after successful authentication
      }
    },
    async session({ session, token }) {
      // Log session events for debugging
    }
  },
  debug: process.env.NODE_ENV === "development", // Enable debug logs in development
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };