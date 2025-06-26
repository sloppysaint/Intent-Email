import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: "true"
  });

  return NextResponse.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  });
}
