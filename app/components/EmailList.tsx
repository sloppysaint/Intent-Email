"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Email = {
  id: string;
  from: string;
  subject: string;
  summary: string;
  intent: string;
};

// Helper: Decode HTML entities in subject or snippet
function decodeHTML(str: string) {
  if (!str) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

// Helper: Extract just the sender’s name or email
function extractSender(from: string) {
  const match = from.match(/^(.*?)(?:\s*<(.+?)>)?$/);
  return match ? (match[1] || match[2] || from) : from;
}

// Helper: Decode Base64 (Gmail format)
function decodeBase64(str: string): string {
  if (!str) return "";
  const decodedStr = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  try {
    return decodeURIComponent(escape(decodedStr));
  } catch {
    return decodedStr;
  }
}

// Helper: Extract the plain text body from Gmail payload
function getEmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
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

// Tag color based on intent
function getTagColor(intent: string) {
  switch (intent?.toLowerCase()) {
    case "urgent":
      return "bg-red-700 text-red-200";
    case "meeting":
      return "bg-blue-700 text-blue-200";
    case "request":
      return "bg-yellow-700 text-yellow-200";
    case "promotion":
      return "bg-pink-700 text-pink-200";
    case "social":
      return "bg-green-700 text-green-200";
    case "update":
      return "bg-purple-700 text-purple-200";
    case "personal":
      return "bg-teal-700 text-teal-200";
    case "primary":
      return "bg-sky-700 text-sky-200";
    case "info":
      return "bg-gray-700 text-gray-200";
    default:
      return "bg-zinc-700 text-white";
  }
}

const INTENT_OPTIONS = [
  "all",
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
  const [filter, setFilter] = useState<string>("all");

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

          // Fetch summary & intent from Gemini API using the full body
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
            // DEBUG: Log what Gemini returned
            console.log("Gemini API JSON:", aiData);
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

  const filteredEmails =
    filter === "all"
      ? emails
      : emails.filter((email) => email.intent === filter);

  if (!session) return null;

  return (
    <div className="mt-8 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-extrabold mb-6 text-white text-center">Your Recent Emails</h2>
      <div className="flex justify-center mb-6">
        <select
          className="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {INTENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {loading && <p className="text-white text-center">Loading...</p>}
      <ul className="space-y-4">
        {filteredEmails.map((email) => (
          <li
            key={email.id}
            className="p-6 border border-gray-700 rounded-2xl bg-gradient-to-r from-slate-900 to-gray-800 text-white shadow-lg hover:scale-[1.02] transition-all"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {decodeHTML(email.subject)}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${getTagColor(email.intent)}`}>
                  {email.intent}
                </span>
              </div>
              <span className="text-sm text-teal-300 italic">
                {extractSender(email.from)}
              </span>
              {email.summary && (
                <span className="block mt-2 text-cyan-200 font-medium">
                  <span className="text-cyan-400 font-semibold">AI Summary:</span> {email.summary}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!loading && filteredEmails.length === 0 && (
        <div className="text-gray-400 text-center mt-8">No emails to display for this filter.</div>
      )}
    </div>
  );
}
