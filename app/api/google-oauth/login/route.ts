// app/api/google-oauth/login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const client_id = process.env.GOOGLE_CLIENT_ID!;
  const redirect_uri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI!;
  const scope = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.readonly"
  ].join(" ");

  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    // Optionally: state, etc.
  });

  return NextResponse.redirect(
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
  );
}
