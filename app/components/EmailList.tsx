import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MailOpen, Clock, Star, Archive, Trash2, Mail, MailOpen as MailOpenIcon, Zap } from "lucide-react";
import { decodeHTML, extractSender } from "@/utils/emailUtils";
import { getTagColor, getIntentIcon } from "@/utils/intentUtils";

// Accepts currentAccount as prop!
export function EmailList({ emails, loading, currentAccount, onAction }) {
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!loading && emails.length === 0)
    return (
      <div className="text-center py-12">
        <MailOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg mb-2">No emails found</p>
        <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
      </div>
    );

  // Helper to send API requests for Gmail actions
  const handleGmailAction = async (emailId: string, action: string) => {
    if (!currentAccount?._id) {
      setError("No account selected");
      return;
    }

    const actionId = `${emailId}-${action}`;
    setActing(actionId);
    setError(null);

    try {
      const response = await fetch("/api/gmail-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          accountId: currentAccount._id, 
          emailId, 
          action 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log(`Successfully executed ${action} on email ${emailId}:`, data);
      
      // Let parent refresh emails or update UI as needed
      if (onAction) {
        onAction(action, emailId);
      }

      // Show success feedback
      setError(null);

    } catch (err) {
      console.error(`Failed to ${action} email:`, err);
      const errorMessage = err instanceof Error ? err.message : "Action failed";
      setError(`Failed to ${action}: ${errorMessage}`);
    } finally {
      setActing(null);
    }
  };

  // Show AI reply modal (event-based, see earlier answer)
  const handleAIDraft = (email: any) => {
    window.dispatchEvent(new CustomEvent("showAIModal", { detail: email }));
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm"
        >
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {emails.map((email, index) => {
          const isActing = acting?.startsWith(email.id);
          
          return (
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
                delay: index * 0.05,
              }}
              whileHover={{ scale: 1.005, y: -2 }}
              className={`group p-5 bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 cursor-pointer ${
                isActing ? "opacity-50 cursor-not-allowed" : ""
              }`}
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
                  <p className="text-sm text-gray-400 mb-2">{extractSender(email.from)}</p>
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
                      {/* Mark as (un)read */}
                      <button
                        title={email.unread ? "Mark as read" : "Mark as unread"}
                        disabled={isActing}
                        className={`hover:text-cyan-400 transition-colors ${
                          acting === `${email.id}-${email.unread ? "markRead" : "markUnread"}` 
                            ? "animate-pulse text-cyan-400" 
                            : ""
                        }`}
                        onClick={() =>
                          handleGmailAction(email.id, email.unread ? "markRead" : "markUnread")
                        }
                      >
                        {email.unread ? <MailOpenIcon className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                      </button>
                      
                      {/* Star/Unstar */}
                      <button
                        title={email.starred ? "Unstar" : "Star"}
                        disabled={isActing}
                        className={`hover:text-yellow-400 transition-colors ${
                          acting === `${email.id}-${email.starred ? "unstar" : "star"}` 
                            ? "animate-pulse text-yellow-400" 
                            : ""
                        } ${email.starred ? "text-yellow-400" : ""}`}
                        onClick={() => handleGmailAction(email.id, email.starred ? "unstar" : "star")}
                      >
                        <Star className={`w-3 h-3 ${email.starred ? "fill-current" : ""}`} />
                      </button>
                      
                      {/* Archive */}
                      <button
                        title="Archive"
                        disabled={isActing}
                        className={`hover:text-cyan-400 transition-colors ${
                          acting === `${email.id}-archive` ? "animate-pulse text-cyan-400" : ""
                        }`}
                        onClick={() => handleGmailAction(email.id, "archive")}
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                      
                      {/* Delete */}
                      <button
                        title="Delete"
                        disabled={isActing}
                        className={`hover:text-red-400 transition-colors ${
                          acting === `${email.id}-delete` ? "animate-pulse text-red-400" : ""
                        }`}
                        onClick={() => handleGmailAction(email.id, "delete")}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      
                      {/* AI Draft Reply */}
                      <button
                        title="AI Draft Reply"
                        disabled={isActing}
                        className="hover:text-cyan-300 transition-colors"
                        onClick={() => handleAIDraft(email)}
                      >
                        <Zap className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}