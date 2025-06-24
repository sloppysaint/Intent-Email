"use client";
import { useSession } from "next-auth/react";
import SignInButton from "./components/SignInButton";
import SignOutButton from "./components/SignOutButton";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center mt-24">
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-24">
      <p>Signed in as {session.user?.email}</p>
      <SignOutButton />
      {/* Next: Gmail inbox will be shown here */}
    </div>
  );
}
