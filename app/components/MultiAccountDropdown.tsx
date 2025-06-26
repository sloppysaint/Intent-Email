import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, UserPlus, Trash2, Loader2 } from "lucide-react";

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

interface MultiAccountDropdownProps {
  accounts: Account[];
  current: Account | null;
  onSwitch: (account: Account) => void;
  onAdd: () => void;
  onRemove?: (email: string) => void;
  isAddingAccount?: boolean;
}

export function MultiAccountDropdown({ 
  accounts, 
  current, 
  onSwitch, 
  onAdd, 
  onRemove, 
  isAddingAccount = false 
}: MultiAccountDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState<string | null>(null);

  const handleRemoveAccount = (email: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (accounts.length <= 1) {
      alert("You cannot remove the last account. Please add another account first.");
      return;
    }
    setShowConfirmDelete(email);
  };

  const confirmDelete = (email: string) => {
    if (onRemove) {
      onRemove(email);
    }
    setShowConfirmDelete(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-lg text-white font-medium hover:bg-gray-700/80 transition-all duration-200 min-w-[200px]"
        onClick={() => setOpen(v => !v)}
      >
        {current?.image ? (
          <img src={current.image} alt="Account" className="w-8 h-8 rounded-full border-2 border-cyan-400/50" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white">
            {current?.name?.[0] || "?"}
          </div>
        )}
        <div className="flex-1 text-left">
          <div className="text-sm font-medium truncate">{current?.name || "Account"}</div>
          <div className="text-xs text-gray-400 truncate">{current?.email}</div>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
              {accounts.length}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 left-0 bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-xl shadow-xl py-2 min-w-[280px]"
          >
            <div className="px-4 py-2 border-b border-gray-600/30">
              <h3 className="text-sm font-medium text-gray-300">Select Account</h3>
              <p className="text-xs text-gray-500">Switch between your connected accounts</p>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {accounts.map(acc => (
                <div key={acc.email} className="relative group">
                  <button
                    className={`w-full text-left px-4 py-3 hover:bg-gray-700/50 transition-colors flex items-center gap-3 ${
                      acc.email === current?.email ? "bg-cyan-500/10 text-cyan-400" : "text-white"
                    }`}
                    onClick={() => {
                      setOpen(false);
                      if (acc.email !== current?.email) {
                        onSwitch(acc);
                      }
                    }}
                  >
                    {acc.image ? (
                      <img src={acc.image} alt="Account" className="w-7 h-7 rounded-full border border-cyan-400/50" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                        {acc.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{acc.name}</div>
                      <div className="text-xs text-gray-400 truncate">{acc.email}</div>
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(acc.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {acc.email === current?.email && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 ml-2"></div>
                    )}
                  </button>
                  
                  {onRemove && accounts.length > 1 && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                      onClick={(e) => handleRemoveAccount(acc.email, e)}
                      title="Remove account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-600/30 mt-2">
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-700/50 transition-colors flex items-center gap-3 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setOpen(false);
                  onAdd();
                }}
                disabled={isAddingAccount}
              >
                {isAddingAccount ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {isAddingAccount ? "Adding account..." : "Add another account"}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog for account deletion */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={() => setShowConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 border border-gray-600 rounded-xl p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-2">Remove Account</h3>
              <p className="text-gray-300 mb-4">
                Are you sure you want to remove the account "{showConfirmDelete}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  onClick={() => setShowConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  onClick={() => confirmDelete(showConfirmDelete)}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}