import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { getRoleLabel, getRoleBadgeVariant } from "@/shared/lib/auth/roles";
import { getTierLabel, getTierBadgeVariant } from "@/shared/lib/auth/subscriptions";
import type { UserRole } from "@/shared/lib/auth/roles";
import type { SubscriptionTier } from "@/shared/lib/auth/subscriptions";
import {
  GlobeIcon,
  FlameIcon,
  TrophyIcon,
  StarIcon,
  AtSignIcon,
} from "lucide-react";

interface ProfileHeaderProps {
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  subscription_level: SubscriptionTier;
  bio: string | null;
  instagram: string | null;
  portfolio_url: string | null;
  stack: string[];
  xp: number;
  level: number;
  streak: number;
}

export function ProfileHeader({
  full_name,
  avatar_url,
  role,
  subscription_level,
  bio,
  instagram,
  portfolio_url,
  stack,
  xp,
  level,
  streak,
}: ProfileHeaderProps) {
  const displayName = full_name || "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4">
        <Avatar className="size-20">
          <AvatarImage src={avatar_url ?? undefined} alt={displayName || "User"} />
          <AvatarFallback className="text-[24px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-display text-[24px] font-bold text-text-1">
            {displayName || "Sem nome"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={getRoleBadgeVariant(role)}>
              {getRoleLabel(role)}
            </Badge>
            {subscription_level !== "free" && (
              <Badge variant={getTierBadgeVariant(subscription_level)}>
                {getTierLabel(subscription_level)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="flex items-center gap-1.5">
          <StarIcon className="size-4 text-amber" />
          <span className="font-mono text-[13px] text-text-1">
            {xp.toLocaleString()} XP
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrophyIcon className="size-4 text-blue" />
          <span className="font-mono text-[13px] text-text-1">
            Nivel {level}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FlameIcon className="size-4 text-red" />
          <span className="font-mono text-[13px] text-text-1">
            {streak} dias
          </span>
        </div>
      </div>

      {/* Bio */}
      {bio && <p className="text-[13px] leading-relaxed text-text-2">{bio}</p>}

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        {instagram && (
          <a
            href={`https://instagram.com/${instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[11px] text-text-3 hover:text-blue"
          >
            <AtSignIcon className="size-3.5" />
            {instagram}
          </a>
        )}
        {portfolio_url && (
          <a
            href={portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[11px] text-text-3 hover:text-blue"
          >
            <GlobeIcon className="size-3.5" />
            Portfolio
          </a>
        )}
      </div>

      {/* Stack */}
      {stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stack.map((tag) => (
            <span
              key={tag}
              className="rounded-[2px] bg-blue-dim px-2 py-0.5 font-mono text-[11px] text-blue"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
