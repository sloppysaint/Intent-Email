"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { MailOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


type Email = {
  id: string;
  from: string;
  subject: string;
  summary: string;
  intent: string;
};

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
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ');
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

const INTENT_OPTIONS = [
  "urgent",
  "meeting",
  "request",
  "update",
  "promotion",
  "social",
  "personal",
  "primary",
  "info",
  "other"
];

export default function EmailList() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session || !(session as any).accessToken) return;

    setLoading(true);

    fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
      {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      }
    )
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.messages) return setEmails([]);
        const results: Email[] = [];
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

          // Fetch summary & intent from OpenRouter API using the full body
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
    // Multi-intent filter
    const intentPass = selectedIntents.length === 0 || selectedIntents.includes(email.intent);
    // Search filter (in subject, summary, from)
    const s = search.toLowerCase();
    const searchPass = !s ||
      decodeHTML(email.subject).toLowerCase().includes(s) ||
      (email.summary || "").toLowerCase().includes(s) ||
      (email.from || "").toLowerCase().includes(s);

    return intentPass && searchPass;
  });

  // UI: multi-checkbox for intents
  const toggleIntent = (intent: string) => {
    setSelectedIntents(selected => 
      selected.includes(intent)
        ? selected.filter(i => i !== intent)
        : [...selected, intent]
    );
  };

  if (!session) return null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-black mb-7 text-white text-center drop-shadow-lg tracking-tight">
        <MailOpen className="inline mr-2 text-cyan-400" size={36} />
        Your Recent Emails
      </h2>
      {/* Multi-intent checkboxes and search bar row */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {INTENT_OPTIONS.map(opt => (
            <label key={opt} className="flex items-center gap-1 text-xs font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-cyan-500"
                checked={selectedIntents.includes(opt)}
                onChange={() => toggleIntent(opt)}
              />
              <span className={`px-2 py-1 rounded-full shadow font-bold ${getTagColor(opt)}`}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </span>
            </label>
          ))}
        </div>
        <input
          type="text"
          className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-900 text-white outline-none w-64 shadow"
          placeholder="Search emails (sender, subject, summary)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading && (
        <div className="text-white text-center my-8 animate-pulse text-lg">
          <Loader2 className="inline mr-2 animate-spin text-cyan-400" />Loading...
        </div>
      )}
      <ul className="space-y-5">
        <AnimatePresence>
          {filteredEmails.map((email) => (
            <motion.li
              key={email.id}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="p-6 border border-gray-700 rounded-2xl bg-gradient-to-br from-[#1a1d2e]/80 to-[#23243a]/90 text-white shadow-xl hover:scale-[1.015] transition-all duration-150"
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
        <div className="text-gray-400 text-center mt-8">No emails to display for these filters.</div>
      )}
    </div>
  );
}