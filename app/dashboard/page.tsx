"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailOpen, Loader2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IntentFilterDropdown from "../components/IntentFilterDropdown";

// --- UTILITY FUNCTIONS ---
function decodeHTML(str: string) {
  if (!str) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}
function extractSender(from: string) {
  const match = from.match(/^(.*?)(?:\s*<(.+?)>)?$/);
  return match ? (match[1] || match[2] || from) : from;
}
function decodeBase64(str: string): string {
  if (!str) return "";
  const decodedStr = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  try {
    return decodeURIComponent(escape(decodedStr));
  } catch {
    return decodedStr;
  }
}
function getEmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        // fallback: basic HTML strip
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, " ");
      }
      if (part.parts) {
        const nested = getEmailBody(part);
        if (nested) return nested;
      }
    }
  }
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }
  return "";
}
function getTagColor(intent: string) {
  switch (intent?.toLowerCase()) {
    case "urgent": return "bg-red-700 text-red-200";
    case "meeting": return "bg-blue-700 text-blue-200";
    case "request": return "bg-yellow-700 text-yellow-200";
    case "promotion": return "bg-pink-700 text-pink-200";
    case "social": return "bg-green-700 text-green-200";
    case "update": return "bg-purple-700 text-purple-200";
    case "personal": return "bg-teal-700 text-teal-200";
    case "primary": return "bg-sky-700 text-sky-200";
    case "info": return "bg-gray-700 text-gray-200";
    default: return "bg-zinc-700 text-white";
  }
}

// --- MAIN DASHBOARD ---
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Authentication protection
  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/"); // Redirect to home if not authenticated
    }
  }, [session, status, router]);

  // Handle sign out with proper redirect
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    window.location.href = "/"; // Force page refresh
  };

  useEffect(() => {
    if (!session || !(session as any).accessToken) return;

    setLoading(true);

    fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15",
      {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      }
    )
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.messages) return setEmails([]);
        const results: any[] = [];
        for (const msg of data.messages) {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: {
                Authorization: `Bearer ${(session as any).accessToken}`,
              },
            }
          );
          const msgData = await res.json();
          const headers = msgData.payload?.headers || [];
          const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
          const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
          const body = getEmailBody(msgData.payload);

          let summary = "";
          let intent = "other";
          try {
            const aiRes = await fetch("/api/openrouter-summarize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: body }),
            });

            const aiData = await aiRes.json();
            summary = aiData.summary || "";
            intent = aiData.intent?.toLowerCase() || "other";
          } catch {
            summary = "";
            intent = "other";
          }

          results.push({
            id: msg.id,
            from,
            subject,
            summary,
            intent,
          });
        }
        setEmails(results);
      })
      .finally(() => setLoading(false));
  }, [session]);

  // FILTERING: search + multi-intent
  const filteredEmails = emails.filter(email => {
    const intentPass = selectedIntents.length === 0 || selectedIntents.includes(email.intent);
    const s = search.toLowerCase();
    const searchPass = !s ||
      decodeHTML(email.subject).toLowerCase().includes(s) ||
      (email.summary || "").toLowerCase().includes(s) ||
      (email.from || "").toLowerCase().includes(s);
    return intentPass && searchPass;
  });

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#181f2a] via-[#23243a] to-[#13151c] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If no session, don't render anything (redirect will happen)
  if (!session) return null;

  // User info
  const userImg = session.user?.image;
  const userName = session.user?.name || session.user?.email || "User";
  const userEmail = session.user?.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181f2a] via-[#23243a] to-[#13151c] flex flex-col">
      {/* HEADER BAR */}
      <header className="w-full flex justify-between items-center px-10 pt-8 pb-2">
        <div className="flex items-center gap-3">
          {userImg ? (
            <img src={userImg} alt="User" className="w-14 h-14 rounded-full border-4 border-cyan-400 shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-cyan-950 border-4 border-cyan-400 flex items-center justify-center text-xl font-bold text-cyan-300">
              {userName[0]}
            </div>
          )}
          <div>
            <div className="text-lg font-bold text-white">{userName}</div>
            <div className="text-gray-300 text-sm">{userEmail}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex gap-2 items-center px-5 py-2 bg-gradient-to-r from-pink-500 to-cyan-400 text-white font-semibold rounded-2xl shadow hover:opacity-90 transition text-base"
        >
          <LogOut className="w-5 h-5" /> Sign out
        </button>
      </header>

      {/* SEARCH BAR */}
      <div className="w-full flex justify-center mt-4">
        <input
          type="text"
          className="px-5 py-3 rounded-2xl border border-cyan-900 bg-gray-900 text-white outline-none w-full max-w-lg shadow focus:border-cyan-500 transition text-lg"
          placeholder="Search your emails by sender, subject, or summary…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* FILTER + EMAILS */}
      <main className="flex-1 w-full flex flex-col items-center mt-8">
        <div className="w-full max-w-4xl bg-white/10 rounded-3xl shadow-2xl px-0 sm:px-6 py-8 backdrop-blur border border-cyan-900">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between mb-6">
            <h2 className="text-3xl font-extrabold mb-2 sm:mb-0 text-white text-center drop-shadow-lg tracking-tight flex items-center gap-2">
              <MailOpen className="inline text-cyan-400" size={36} />
              Your Recent Emails
            </h2>
            <div className="flex justify-center sm:justify-end w-full sm:w-auto">
              <IntentFilterDropdown selected={selectedIntents} setSelected={setSelectedIntents} />
            </div>
          </div>
          {/* EMAILS LIST */}
          {loading && (
            <div className="text-white text-center my-8 animate-pulse text-lg">
              <Loader2 className="inline mr-2 animate-spin text-cyan-400" />Loading...
            </div>
          )}
          <ul className="space-y-6 px-2">
            <AnimatePresence>
              {filteredEmails.map((email) => (
                <motion.li
                  key={email.id}
                  layout
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 40, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="p-6 border border-gray-700 rounded-2xl bg-gradient-to-br from-[#1a1d2e]/90 to-[#23243a]/95 text-white shadow-xl hover:scale-[1.015] transition-all duration-150"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold drop-shadow">
                        {decodeHTML(email.subject)}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full shadow ${getTagColor(email.intent)}`}>
                        {email.intent}
                      </span>
                    </div>
                    <span className="text-sm text-teal-300 italic">{extractSender(email.from)}</span>
                    <span className="block mt-2 text-cyan-200 font-medium">
                      <span className="text-cyan-400 font-semibold">AI Summary:</span> {email.summary || "No summary generated."}
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {!loading && filteredEmails.length === 0 && (
            <div className="text-gray-400 text-center mt-8 mb-4">No emails to display for these filters.</div>
          )}
        </div>
      </main>
      <footer className="mt-12 text-center text-gray-500 text-xs w-full pb-6">
        &copy; {new Date().getFullYear()} Inbox Insight AI.<br />
        Built with Next.js, OpenRouter, and Google APIs.
      </footer>
    </div>
  );
}