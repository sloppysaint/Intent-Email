import { Mail, Zap, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export function StatsBar({ emails }) {
  const stats = [
    { label: "Total Emails", value: emails.length, icon: <Mail className="w-4 h-4" />, color: "text-cyan-400" },
    { label: "Urgent", value: emails.filter(e => e.intent === "urgent").length, icon: <Zap className="w-4 h-4" />, color: "text-red-400" },
    { label: "Meetings", value: emails.filter(e => e.intent === "meeting").length, icon: <Users className="w-4 h-4" />, color: "text-blue-400" },
    { label: "Processed", value: emails.filter(e => e.summary && e.summary !== "No summary generated.").length, icon: <BarChart3 className="w-4 h-4" />, color: "text-green-400" }
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
            <div className={`${stat.color} bg-gray-700/50 p-2 rounded-lg`}>{stat.icon}</div>
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
