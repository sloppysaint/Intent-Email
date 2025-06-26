// app/api/refresh-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AccountModel } from "@/models/Account";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await req.json();
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find the account and verify it belongs to the current user
    const account = await AccountModel.findOne({ 
      _id: accountId, 
      userId: session.userId 
    });
    
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if token is still valid (5 minute buffer)
    const now = Date.now();
    if (account.accessTokenExpires > now + 5 * 60 * 1000) {
      return NextResponse.json({
        accessToken: account.accessToken,
        accessTokenExpires: account.accessTokenExpires,
      });
    }

    // Token needs refresh
    if (!account.refreshToken) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 400 });
    }

    // Refresh the token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: account.refreshToken!,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Token refresh failed:", errorData);
      return NextResponse.json({ error: "Token refresh failed" }, { status: 400 });
    }

    const tokens = await response.json();
    
    // Update account with new tokens
    const updatedAccount = await AccountModel.findOneAndUpdate(
      { _id: accountId },
      {
        $set: {
          accessToken: tokens.access_token,
          accessTokenExpires: now + tokens.expires_in * 1000,
          refreshToken: tokens.refresh_token || account.refreshToken, // Keep old refresh token if new one not provided
          updatedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!updatedAccount) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    return NextResponse.json({
      accessToken: updatedAccount.accessToken,
      accessTokenExpires: updatedAccount.accessTokenExpires,
      refreshToken: updatedAccount.refreshToken,
    });

  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}