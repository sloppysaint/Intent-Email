import {
  Zap, Users, Mail, TrendingUp, Bell, Star, Activity
} from "lucide-react";

export function getTagColor(intent: string) {
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

export function getIntentIcon(intent: string) {
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
