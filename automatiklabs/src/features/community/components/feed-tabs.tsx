"use client";

import type { FeedFilter } from "../types";

interface FeedTabsProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const tabs: { id: FeedFilter; label: string; dot?: string }[] = [
  { id: "recentes", label: "Recentes" },
  { id: "populares", label: "Populares" },
  { id: "seguindo", label: "Seguindo" },
  { id: "ai-feed", label: "AI Feed", dot: "bg-violet" },
];

export function FeedTabs({ activeFilter, onFilterChange }: FeedTabsProps) {
  return (
    <div className="flex gap-0 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onFilterChange(tab.id)}
          className={`-mb-px flex items-center gap-[6px] border-b-2 px-4 py-[10px] font-body text-[13px] font-medium transition-colors duration-[80ms] ${
            activeFilter === tab.id
              ? "border-blue text-text-1"
              : "border-transparent text-text-3 hover:text-text-2"
          }`}
        >
          {tab.dot && (
            <span
              className={`h-[6px] w-[6px] rounded-full ${tab.dot}`}
            />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default FeedTabs;
