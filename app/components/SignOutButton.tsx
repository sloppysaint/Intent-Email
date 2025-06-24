"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      className="px-4 py-2 bg-red-500 text-white rounded-lg"
      onClick={() => signOut()}
    >
      Sign out
    </button>
  );
}
