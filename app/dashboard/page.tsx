"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { 
  MailOpen, 
  Loader2, 
  LogOut, 
  UserPlus, 
  ChevronDown, 
  Search,
  Filter,
  RefreshCw,
  Settings,
  Bell,
  TrendingUp,
  Archive,
  Star,
  Clock,
  Users,
  Mail,
  Activity,
  BarChart3,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IntentFilterDropdown from "../components/IntentFilterDropdown";

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
    case "urgent": return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "meeting": return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "request": return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "promotion": return "bg-pink-500/20 text-pink-400 border border-pink-500/30";
    case "social": return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "update": return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    case "personal": return "bg-teal-500/20 text-teal-400 border border-teal-500/30";
    case "primary": return "bg-sky-500/20 text-sky-400 border border-sky-500/30";
    case "info": return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    default: return "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30";
  }
}

function getIntentIcon(intent: string) {
  switch (intent?.toLowerCase()) {
    case "urgent": return <Zap className="w-3 h-3" />;
    case "meeting": return <Users className="w-3 h-3" />;
    case "request": return <Mail className="w-3 h-3" />;
    case "promotion": return <TrendingUp className="w-3 h-3" />;
    case "social": return <Users className="w-3 h-3" />;
    case "update": return <Bell className="w-3 h-3" />;
    case "personal": return <Star className="w-3 h-3" />;
    case "primary": return <Mail className="w-3 h-3" />;
    case "info": return <Activity className="w-3 h-3" />;
    default: return <Mail className="w-3 h-3" />;
  }
}

// Enhanced Stats Component
function StatsBar({ emails }) {
  const stats = [
    {
      label: "Total Emails",
      value: emails.length,
      icon: <Mail className="w-4 h-4" />,
      color: "text-cyan-400"
    },
    {
      label: "Urgent",
      value: emails.filter(e => e.intent === "urgent").length,
      icon: <Zap className="w-4 h-4" />,
      color: "text-red-400"
    },
    {
      label: "Meetings",
      value: emails.filter(e => e.intent === "meeting").length,
      icon: <Users className="w-4 h-4" />,
      color: "text-blue-400"
    },
    {
      label: "Processed",
      value: emails.filter(e => e.summary && e.summary !== "No summary generated.").length,
      icon: <BarChart3 className="w-4 h-4" />,
      color: "text-green-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className={`${stat.color} bg-gray-700/50 p-2 rounded-lg`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Enhanced Multi-Account Dropdown
function MultiAccountDropdown({ accounts, current, onSwitch, onAdd }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-lg text-white font-medium hover:bg-gray-700/80 transition-all duration-200 min-w-[200px]"
        onClick={() => setOpen(v => !v)}
      >
        {current?.image ? (
          <img 
            src={current.image} 
            alt="Account" 
            className="w-8 h-8 rounded-full border-2 border-cyan-400/50" 
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white">
            {current?.name?.[0] || "?"}
          </div>
        )}
        <div className="flex-1 text-left">
          <div className="text-sm font-medium truncate">{current?.name || "Account"}</div>
          <div className="text-xs text-gray-400 truncate">{current?.email}</div>
        </div>
        <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </motion.button>
      
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 left-0 bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-xl shadow-xl py-2 min-w-[220px]"
          >
            {accounts.map(acc => (
              <button
                key={acc.email}
                className={`w-full text-left px-4 py-3 hover:bg-gray-700/50 transition-colors flex items-center gap-3 ${
                  acc.email === current.email ? "bg-cyan-500/10 text-cyan-400" : "text-white"
                }`}
                onClick={() => {
                  setOpen(false);
                  onSwitch(acc);
                }}
              >
                {acc.image ? (
                  <img src={acc.image} alt="Account" className="w-7 h-7 rounded-full border border-cyan-400/50" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                    {acc.name?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">{acc.name}</div>
                  <div className="text-xs text-gray-400">{acc.email}</div>
                </div>
              </button>
            ))}
            <div className="border-t border-gray-600/30 my-2"></div>
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              onClick={() => {
                setOpen(false);
                onAdd();
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Add another account</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced Header with Actions
function HeaderActions({ onRefresh, loading }) {
  return (
    <div className="flex items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRefresh}
        disabled={loading}
        className="p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-gray-700/80 transition-all duration-200 disabled:opacity-50"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-gray-700/80 transition-all duration-200"
      >
        <Bell className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-gray-300 hover:text-cyan-400 hover:bg-gray-700/80 transition-all duration-200"
      >
        <Settings className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

// Main Dashboard Component
export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState<any | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Fetch emails function
  const fetchEmails = async () => {
    if (!currentAccount || !currentAccount.token) return;
    setLoading(true);

    try {
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15",
        {
          headers: {
            Authorization: `Bearer ${currentAccount.token}`,
          },
        }
      );
      
      const data = await response.json();
      if (!data.messages) return setEmails([]);
      
      const results: any[] = [];
      for (const msg of data.messages) {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${currentAccount.token}`,
            },
          }
        );
        const msgData = await res.json();
        const headers = msgData.payload?.headers || [];
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
        const date = headers.find((h: any) => h.name === "Date")?.value || "";
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
          date,
          unread: !msgData.labelIds?.includes('UNREAD') ? false : true
        });
      }
      setEmails(results);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save session account to localStorage
  useEffect(() => {
    if (session?.user?.email && (session as any).accessToken) {
      const accs = JSON.parse(localStorage.getItem("connectedEmails") || "[]");
      if (!accs.find((a: any) => a.email === session.user.email)) {
        const newAcc = {
          email: session.user.email,
          token: (session as any).accessToken,
          image: session.user.image,
          name: session.user.name,
        };
        accs.push(newAcc);
        localStorage.setItem("connectedEmails", JSON.stringify(accs));
      }
    }
  }, [session]);

  // Load accounts from localStorage
  useEffect(() => {
    const accs = JSON.parse(localStorage.getItem("connectedEmails") || "[]");
    setAccounts(accs);
    if (session?.user?.email) {
      setCurrentAccount(accs.find((a: any) => a.email === session.user.email) || accs[0] || null);
    } else {
      setCurrentAccount(accs[0] || null);
    }
  }, [session]);

  // Fetch emails for current account
  useEffect(() => {
    fetchEmails();
  }, [currentAccount]);

  // FILTERING
  const filteredEmails = emails.filter(email => {
    const intentPass = selectedIntents.length === 0 || selectedIntents.includes(email.intent);
    const s = search.toLowerCase();
    const searchPass = !s ||
      decodeHTML(email.subject).toLowerCase().includes(s) ||
      (email.summary || "").toLowerCase().includes(s) ||
      (email.from || "").toLowerCase().includes(s);
    return intentPass && searchPass;
  });

  // Handle client-side redirect
  useEffect(() => {
    if (status === "loading") return;
    if (!session && typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, [status, session]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#111827]">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <MailOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Inbox Insight AI</h1>
                  <p className="text-xs text-gray-400">Smart Email Management</p>
                </div>
              </div>
              
              <MultiAccountDropdown
                accounts={accounts}
                current={currentAccount}
                onSwitch={acc => setCurrentAccount(acc)}
                onAdd={() => signIn("google", { prompt: "select_account" })}
              />
            </div>

            <div className="flex items-center gap-4">
              <HeaderActions onRefresh={fetchEmails} loading={loading} />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signOut()}
                className="flex gap-2 items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Section */}
        <StatsBar emails={emails} />

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
              placeholder="Search emails..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <IntentFilterDropdown selected={selectedIntents} setSelected={setSelectedIntents} />
        </div>

        {/* Emails Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <MailOpen className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Recent Emails</h2>
            <div className="flex-1"></div>
            {loading && (
              <div className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30,
                    delay: index * 0.05
                  }}
                  whileHover={{ scale: 1.005, y: -2 }}
                  className="group p-5 bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium">
                        {extractSender(email.from)[0]?.toUpperCase() || "?"}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                          {decodeHTML(email.subject)}
                        </h3>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTagColor(email.intent)}`}>
                          {getIntentIcon(email.intent)}
                          {email.intent}
                        </div>
                        {email.unread && (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">
                        {extractSender(email.from)}
                      </p>
                      
                      <div className="bg-gray-600/20 border border-gray-600/30 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-300 leading-relaxed">
                          <span className="text-cyan-400 font-medium">AI Summary: </span>
                          {email.summary || "No summary generated."}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {email.date ? new Date(email.date).toLocaleDateString() : "Recently"}
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="hover:text-cyan-400 transition-colors">
                            <Star className="w-3 h-3" />
                          </button>
                          <button className="hover:text-cyan-400 transition-colors">
                            <Archive className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!loading && filteredEmails.length === 0 && (
            <div className="text-center py-12">
              <MailOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No emails found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="mt-16 border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Inbox Insight AI. All rights reserved.</p>
            <p className="mt-2">Built with Next.js, OpenRouter, and Google APIs</p>
          </div>
        </div>
      </footer>
    </div>
  );
}