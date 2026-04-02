import Link from "next/link";
import type { Channel } from "../types";

interface ChannelListProps {
  channels: Channel[];
}

export function ChannelList({ channels }: ChannelListProps) {
  return (
    <div className="flex flex-col gap-0">
      {channels.map((channel) => (
        <Link
          key={channel.id}
          href={`/community/${channel.slug}`}
          className="flex items-start gap-3 border-b border-border px-4 py-3 transition-colors duration-[80ms] hover:bg-bg-hover"
        >
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-border bg-bg-inset text-[18px]">
            {channel.image_url ? (
              <img
                src={channel.image_url}
                alt=""
                className="h-full w-full rounded-[2px] object-cover"
              />
            ) : (
              <span>
                {channel.type === "course"
                  ? "\uD83D\uDCD6"
                  : channel.type === "topic"
                    ? "\uD83D\uDCA1"
                    : "\uD83D\uDCAC"}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-[14px] font-semibold text-text-1">
                {channel.name}
              </span>
              {channel.tier_required !== "free" && (
                <span className="rounded-[2px] bg-blue-dim px-[6px] py-[1px] font-mono text-[10px] font-medium text-blue">
                  {channel.tier_required}
                </span>
              )}
            </div>
            {channel.description && (
              <p className="mt-[2px] truncate text-[13px] text-text-3">
                {channel.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ChannelList;
