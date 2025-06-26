import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AccountModel } from "@/models/Account";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("userId"); // Pass this as state param or via cookies/session

  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code or userId" }, { status: 400 });
  }

  // Exchange code for tokens
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const tokens = await tokenRes.json();

  // Get user info
  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await infoRes.json();

  await connectToDatabase();
  // Save or update account in DB
  await AccountModel.findOneAndUpdate(
    { email: profile.email },
    {
      $set: {
        userId,
        email: profile.email,
        name: profile.name,
        image: profile.picture,
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpires: Date.now() + (tokens.expires_in ?? 3600) * 1000,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // Close popup and notify parent
  return new NextResponse(`
    <html>
      <body>
        <script>
          window.opener.postMessage({ success: true, email: "${profile.email}" }, "*");
          window.close();
        </script>
        <p>You can close this window now.</p>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}
