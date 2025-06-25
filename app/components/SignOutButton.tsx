"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "react-hot-toast"; // Make sure to install: npm install react-hot-toast

export default function SignOutButton() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setShowModal(false);
    
    // Show toast notification first
    toast.success("Signing out...", {
      duration: 1000,
      position: "top-center",
      style: {
        background: "#10b981",
        color: "#fff",
        fontWeight: "600",
      },
    });
    
    // Add a small delay, then sign out and redirect
    setTimeout(async () => {
      await signOut({ redirect: false });
      router.push("/");
      window.location.href = "/";
    }, 1000);
  };

  return (
    <>
      <button
        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-cyan-400 hover:from-cyan-500 hover:to-pink-400 text-white font-bold py-2 px-6 rounded-2xl shadow-xl text-lg transition-all duration-200 focus:ring-2 ring-cyan-400"
        onClick={() => setShowModal(true)}
      >
        <LogOut className="w-5 h-5" />
        Sign out
      </button>
      
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-[#181b26] text-white rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-3">Are you sure you want to sign out?</h2>
            <div className="flex gap-6 mt-2">
              <button
                onClick={handleSignOut}
                className="bg-gradient-to-r from-red-500 to-pink-400 hover:from-pink-500 hover:to-red-400 px-5 py-2 rounded-lg font-semibold shadow"
              >
                Yes, Sign Out
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}