import { motion } from "framer-motion";
import { RefreshCw, Bell, Settings } from "lucide-react";

export function HeaderActions({ onRefresh, loading }) {
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
