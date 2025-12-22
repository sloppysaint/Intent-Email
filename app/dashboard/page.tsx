"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  MailOpen,
  LogOut,
  Search,
} from "lucide-react";

import { StatsBar } from "../components/StatsBar";
import { MultiAccountDropdown } from "../components/MultiAccountDropdown";
import { HeaderActions } from "../components/HeaderActions";
import { EmailList } from "../components/EmailList";
import IntentFilterDropdown from "../components/IntentFilterDropdown";
import { getEmailBody } from "@/utils/emailUtils";

// Extend Session type to include custom properties
interface ExtendedSession {
  userId?: string;
  email?: string;
  accessToken?: string;
  error?: string;
  shouldRefresh?: boolean;
}

interface Account {
  _id: string;
  userId: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpires: number;
  createdAt: string;
  updatedAt: string;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  summary: string;
  intent: string;
  date: string;
  unread: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession | null;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const lastFetchTimeRef = useRef<number>(0); // <<< CHANGE: new ref for fetch cooldown

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  const FETCH_COOLDOWN = 30 * 1000;
  const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000;

  // Loads all linked accounts
  const loadAccounts = async () => {
    if (!extendedSession) {
      console.log("No session available for loadAccounts");
      return;
    }
    
    if (!extendedSession.userId) {
      console.error("Session exists but no userId:", { 
        sessionKeys: Object.keys(extendedSession),
        email: extendedSession.email 
      });
      return;
    }
    
    try {
      console.log("Loading accounts for userId:", extendedSession.userId);
      const res = await fetch(`/api/accounts`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to load accounts:", res.status, errorData);
        return;
      }
      
      const list: Account[] = await res.json();
      console.log(`Loaded ${list.length} accounts`);
      setAccounts(list);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  // useEffect 1: Loads accounts when session changes
  useEffect(() => {
    if (extendedSession && extendedSession.userId) {
      loadAccounts();
    } else {
      setAccounts([]);
      setCurrentAccount(null);
    }
    // Don't set currentAccount here!
  }, [extendedSession?.userId]); // Only depend on userId to avoid unnecessary re-renders

  // useEffect 2: Keeps currentAccount in sync with accounts
  useEffect(() => {
    if (!currentAccount && accounts.length > 0) {
      setCurrentAccount(accounts[0]);
    } else if (
      currentAccount &&
      !accounts.find(acc => acc._id === currentAccount._id)
    ) {
      setCurrentAccount(accounts[0] || null);
    } else if (accounts.length === 0 && currentAccount) {
      setCurrentAccount(null);
    }
  }, [accounts]);

  // useEffect 3: Clears currentAccount if session ends
  useEffect(() => {
    if (!session) {
      setCurrentAccount(null);
    }
  }, [session]);

  // Get valid access token with server-side refresh
  const getValidAccessToken = async (acc: Account): Promise<string | null> => {
    try {
      const res = await fetch("/api/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: acc._id }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedAccount = { ...acc, ...data };
        setAccounts(prev =>
          prev.map(a => a._id === acc._id ? updatedAccount : a)
        );
        if (currentAccount?._id === acc._id) {
          setCurrentAccount(updatedAccount);
        }
        return data.accessToken;
      } else {
        const errorData = await res.json().catch(() => ({}));
        
        // Handle invalid_grant - refresh token revoked
        if (errorData.error === "invalid_grant" || errorData.requiresReauth) {
          console.warn("Refresh token invalid for account:", acc.email);
          console.warn("User needs to re-authenticate. Removing account from list.");
          
          // Remove the account that needs re-authentication
          const remaining = accounts.filter((a) => a._id !== acc._id);
          setAccounts(remaining);
          
          // If this was the current account, clear it
          if (currentAccount?._id === acc._id) {
            setCurrentAccount(null);
          }
          
          // Show a message to the user (you could use a toast notification here)
          alert(`Your Google account (${acc.email}) needs to be re-authenticated. Please add it again.`);
          
          return null;
        }
        
        console.error("Token refresh failed:", errorData);
        return null;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  };

  // Throttled fetch function for emails
  const fetchEmails = useCallback(async (force: boolean = false) => {
    if (!currentAccount) return;

    if (isFetchingRef.current) {
      return;
    }

    // <<< CHANGE: use ref for fetch time so the function doesn't change on every render
    const now = Date.now();
    if (!force && (now - lastFetchTimeRef.current) < FETCH_COOLDOWN) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      let token = await getValidAccessToken(currentAccount);
      if (!token) {
        console.error("No valid access token available");
        setEmails([]);
        return;
      }

      let res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Handle 401 Unauthorized - token might be invalid, try refreshing
      if (res.status === 401) {
        console.warn("Gmail API returned 401 - attempting token refresh");
        const newToken = await getValidAccessToken(currentAccount);
        if (newToken && newToken !== token) {
          token = newToken; // Update token for subsequent requests
          // Retry with new token
          res = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(`Gmail API error: ${res.status}`, errorText);
        setEmails([]);
        return;
      }
      
      const data = await res.json();
      if (!data.messages) {
        setEmails([]);
        return;
      }

      const emailPromises = data.messages.map(async (m: any) => {
        try {
          const mr = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!mr.ok) {
            console.error(`Failed to fetch message ${m.id}`);
            return null;
          }

          const md = await mr.json();
          const h = md.payload.headers || [];
          const from = h.find((x: any) => x.name === "From")?.value || "";
          const subject = h.find((x: any) => x.name === "Subject")?.value || "";
          const date = h.find((x: any) => x.name === "Date")?.value || "";
          const body = getEmailBody(md.payload);

          let summary = "";
          let intent = "other";

          try {
            if (!body || body.trim().length === 0) {
              console.warn("Skipping AI summarization - empty email body");
              summary = "No content available";
              intent = "other";
            } else {
              const ai = await fetch("/api/openrouter-summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: body }),
              });

              if (ai.ok) {
                const aij = await ai.json();
                summary = aij.summary || "";
                intent = aij.intent?.toLowerCase() || "other";
                
                if (aij.error) {
                  console.warn("OpenRouter API returned error:", aij.error);
                }
              } else {
                const errorData = await ai.json().catch(() => ({ error: "Unknown error" }));
                console.error("AI summarization API error:", ai.status, errorData);
              }
            }
          } catch (aiError) {
            console.error("AI summarization failed:", aiError);
          }

          return {
            id: m.id,
            from,
            subject,
            date,
            summary,
            intent,
            unread: md.labelIds?.includes("UNREAD") || false,
          };
        } catch (error) {
          console.error(`Error processing message ${m.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(emailPromises);
      const validEmails = results.filter(email => email !== null) as Email[];
      setEmails(validEmails);

      setLastFetchTime(now); // update state for debug/info/UI
      lastFetchTimeRef.current = now; // <<< CHANGE: update ref for next cooldown check
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      setEmails([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentAccount]); // <<< CHANGE: no dependency on lastFetchTime!

  // Manual refresh function (bypasses cooldown)
  const handleManualRefresh = useCallback(() => {
    fetchEmails(true);
  }, [fetchEmails]);

  // Set up auto-refresh interval (2 minutes)
  useEffect(() => {
    if (currentAccount) {
      fetchEmails(true); // Initial fetch
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        fetchEmails(false);
      }, AUTO_REFRESH_INTERVAL);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setEmails([]);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [currentAccount, fetchEmails]);

  // Handle adding new account
  const handleAddAccount = async () => {
    setIsAddingAccount(true);
    try {
      await signIn("google", {
        prompt: "select_account consent",
        access_type: "offline",
        callbackUrl: window.location.href,
      });
    } catch (error) {
      console.error("Failed to add account:", error);
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleSwitchAccount = (acc: Account) => {
    if (acc._id !== currentAccount?._id) {
      setCurrentAccount(acc);
      setEmails([]); // Clear current emails
      setSearch(""); // Clear search
      setSelectedIntents([]); // Clear filters
      setLastFetchTime(0);
      lastFetchTimeRef.current = 0; // <<< CHANGE: also reset ref when switching
    }
  };

  const handleRemoveAccount = async (email: string) => {
    if (!extendedSession?.userId) return;

    try {
      const res = await fetch(`/api/accounts?email=${email}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const remaining = accounts.filter((a) => a.email !== email);
        setAccounts(remaining);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to remove account:", res.status, errorData);
      }
    } catch (error) {
      console.error("Failed to remove account:", error);
    }
  };

  // Listen for new account additions (multi-tab support)
  useEffect(() => {
    const handleAccountAdded = (e: StorageEvent) => {
      if (e.key === "accountAdded" && e.newValue === "true") {
        setTimeout(() => {
          loadAccounts();
          localStorage.removeItem("accountAdded");
        }, 1000);
      }
    };

    window.addEventListener("storage", handleAccountAdded);
    return () => window.removeEventListener("storage", handleAccountAdded);
  }, [extendedSession]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      window.location.replace("/");
    }
  }, [status, session]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Filter emails based on search and intent
  const filtered = emails.filter((e) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      e.subject.toLowerCase().includes(searchLower) ||
      e.from.toLowerCase().includes(searchLower) ||
      e.summary.toLowerCase().includes(searchLower);

    const matchesIntent =
      !selectedIntents.length ||
      selectedIntents.includes(e.intent);

    return matchesSearch && matchesIntent;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#111827] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#111827]">
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <MailOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Inbox Insight AI
                  </h1>
                  <p className="text-xs text-gray-400">
                    Smart Email Management
                  </p>
                </div>
              </div>
              <MultiAccountDropdown
                accounts={accounts}
                current={currentAccount}
                onSwitch={handleSwitchAccount}
                onAdd={handleAddAccount}
                onRemove={handleRemoveAccount}
                isAddingAccount={isAddingAccount}
              />
            </div>
            <div className="flex items-center gap-4">
              <HeaderActions onRefresh={handleManualRefresh} loading={loading} />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex gap-2 items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <StatsBar emails={emails} />

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
            />
          </div>
          <IntentFilterDropdown
            selected={selectedIntents}
            setSelected={setSelectedIntents}
          />
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          {!currentAccount ? (
            <div className="text-center py-12">
              <MailOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Account Selected
              </h3>
              <p className="text-gray-400 mb-4">
                Please add a Google account to start managing your emails.
              </p>
              <button
                onClick={handleAddAccount}
                disabled={isAddingAccount}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {isAddingAccount ? "Adding Account..." : "Add Google Account"}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-gray-700/30 rounded-xl">
                <p className="text-sm text-gray-300">
                  Currently viewing emails from:{" "}
                  <span className="text-cyan-400 font-medium">
                    {currentAccount.email}
                  </span>
                  {accounts.length > 1 && (
                    <span className="text-gray-400 ml-2">
                      ({accounts.length} accounts connected)
                    </span>
                  )}
                  <span className="text-gray-400 ml-2">
                    • Auto-refresh every 2 minutes
                  </span>
                </p>
              </div>
              <EmailList
                emails={filtered}
                loading={loading}
                currentAccount={currentAccount}
                onAction={handleManualRefresh}
              />
            </>
          )}
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Inbox Insight AI. All rights reserved.</p>
            <p className="mt-2">Built with Next.js, OpenRouter and Google APIs</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
