"use client";
import * as React from "react";
import { Filter, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const INTENT_OPTIONS = [
  "Urgent",
  "Meeting",
  "Request",
  "Update",
  "Promotion",
  "Social",
  "Personal",
  "Primary",
  "Info",
  "Other",
];

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

export default function IntentFilterDropdown({
  selected,
  setSelected,
}: {
  selected: string[];
  setSelected: (vals: string[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white border border-cyan-500 shadow hover:bg-gray-800 transition font-medium min-w-[220px] max-w-[480px]">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="font-bold">Filter Intents</span>
          <div className="flex gap-1 ml-2 flex-wrap">
            {selected.length > 0 ? (
              selected.map((intent) => (
                <span
                  key={intent}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${getTagColor(
                    intent
                  )}`}
                >
                  {intent[0].toUpperCase() + intent.slice(1)}
                </span>
              ))
            ) : (
              <span className="text-gray-400 ml-1">All</span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 bg-[#181c28] text-white border border-cyan-800 shadow-2xl rounded-xl"
      >
        <DropdownMenuLabel className="text-white">
          Show emails by intent
        </DropdownMenuLabel>
        {INTENT_OPTIONS.map((opt) => {
          const checked = selected.includes(opt.toLowerCase());
          return (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={checked}
              onCheckedChange={(isChecked) => {
                if (isChecked) setSelected([...selected, opt.toLowerCase()]);
                else
                  setSelected(selected.filter((s) => s !== opt.toLowerCase()));
              }}
              className="flex items-center gap-2 px-3 py-2 focus:bg-cyan-800/30 focus:text-cyan-200 rounded relative pl-7"
            >
              {/* Custom check icon */}
              {checked && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-cyan-400">
                  <Check className="w-4 h-4" />
                </span>
              )}
              {opt}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
