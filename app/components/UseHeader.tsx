"use client";
import { useSession } from "next-auth/react";
import SignOutButton from "./SignOutButton";
import Image from "next/image";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export default function UserHeader() {
  const { data: session } = useSession();

  if (!session?.user) return null;
  const { name, email, image } = session.user;

  return (
    <div className="flex flex-wrap md:flex-nowrap items-center justify-between w-full max-w-3xl mb-8 px-4 gap-4">
      <div className="flex items-center gap-4">
        {image ? (
          <Image
            src={image}
            alt="User"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full border-2 border-cyan-400 shadow object-cover"
            priority
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 flex items-center justify-center text-white font-bold text-xl bg-gray-900">
            {getInitials(name || email)}
          </div>
        )}
        <div>
          <div className="text-white font-bold text-lg">{name || "User"}</div>
          <div className="text-gray-400 text-xs">{email}</div>
        </div>
      </div>
      <SignOutButton />
    </div>
  );
}
