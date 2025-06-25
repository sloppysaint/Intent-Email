"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function SignInCard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // FIX: Move router.replace into useEffect
  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="bg-gray-900/60 rounded-3xl shadow-2xl px-10 py-12 flex items-center justify-center min-w-[340px]">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  if (session) {
    // Don't render anything while redirecting
    return null;
  }

  return (
    <div className="bg-[#191b2f]/80 rounded-3xl shadow-2xl px-10 py-12 flex flex-col items-center gap-7 min-w-[340px] glass">
      <span className="text-2xl font-semibold text-white mb-2">Sign in to get started</span>
      <button
        onClick={() => signIn("google")}
        className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-400 text-white font-bold py-3 px-8 rounded-2xl shadow-xl text-lg transition-all duration-200 focus:ring-2 ring-cyan-400"
      >
        <svg width={24} height={24} viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7c-1 4.1-5 6.6-11.7 6.6-7 0-12.7-5.7-12.7-12.7S17 9.7 24 9.7c3.1 0 6 .9 8.1 2.7l6-5.9C34.7 2.5 29.7.5 24 .5 12.3.5 3 9.8 3 21.5 3 33.2 12.3 42.5 24 42.5c10.8 0 21-8.4 21-21 0-1.4-.2-2.5-.5-3.5z"/><path fill="#34A853" d="M6.9 14.5l7 5.2C15.3 17 19.2 13.5 24 13.5c3.1 0 6 .9 8.1 2.7l6-5.9C34.7 2.5 29.7.5 24 .5c-6.2 0-11.7 2.5-15.6 6.5z"/><path fill="#FBBC05" d="M24 42.5c5.8 0 11.2-2 15.4-5.3l-7.2-5.9c-2.1 1.4-4.8 2.2-8.2 2.2-5.7 0-10.4-3.8-12-9z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.4 4.5-5.7 7.6-11.7 7.6-7 0-12.7-5.7-12.7-12.7S17 9.7 24 9.7c3.1 0 6 .9 8.1 2.7l6-5.9C34.7 2.5 29.7.5 24 .5 12.3.5 3 9.8 3 21.5 3 33.2 12.3 42.5 24 42.5c10.8 0 21-8.4 21-21 0-1.4-.2-2.5-.5-3.5z"/></g></svg>
        Sign in with Google
      </button>
      <span className="text-xs text-gray-400 text-center">We never store your email data. Powered by Next.js + OpenRouter.</span>
    </div>
  );
}
