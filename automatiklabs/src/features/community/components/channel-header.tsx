"use client";

import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import type { Channel, ChannelTab } from "../types";

interface ChannelHeaderProps {
  channel: Channel;
  tabs: ChannelTab[];
  activeTab?: string;
  onTabChange?: (tabSlug: string) => void;
}

export function ChannelHeader({
  channel,
  tabs,
  activeTab,
  onTabChange,
}: ChannelHeaderProps) {
  return (
    <div className="border-b border-border pb-0">
      {/* Channel info */}
      <div className="py-5">
        <div className="flex items-center gap-3">
          {channel.image_url ? (
            <img
              src={channel.image_url}
              alt=""
              className="h-10 w-10 rounded-[2px] border border-border object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-border bg-bg-inset text-[20px]">
              {channel.type === "course"
                ? "\uD83D\uDCD6"
                : channel.type === "topic"
                  ? "\uD83D\uDCA1"
                  : "\uD83D\uDCAC"}
            </div>
          )}
          <div>
            <h1 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
              {channel.name}
            </h1>
            {channel.description && (
              <p className="mt-[2px] text-[13px] text-text-3">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        {channel.tier_required !== "free" && (
          <div className="mt-3 inline-flex items-center gap-1 rounded-[2px] bg-blue-dim px-[8px] py-[3px] font-mono text-[10px] font-medium text-blue">
            Requer plano {channel.tier_required}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <Tabs
          value={activeTab ?? tabs[0]?.slug}
          onValueChange={(val) => onTabChange?.(val)}
        >
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.slug}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}

export default ChannelHeader;
