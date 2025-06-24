"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      onClick={() => signIn("google")}
    >
      Sign in with Google
    </button>
  );
}
