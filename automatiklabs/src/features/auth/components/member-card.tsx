import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { getRoleLabel, getRoleBadgeVariant } from "@/shared/lib/auth/roles";
import type { UserRole } from "@/shared/lib/auth/roles";
import Link from "next/link";

interface MemberCardProps {
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  xp: number;
  bio: string | null;
  stack: string[];
}

export function MemberCard({
  username,
  full_name,
  avatar_url,
  role,
  xp,
  bio,
  stack,
}: MemberCardProps) {
  const initials = full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/members/${username}`}
      className="flex flex-col gap-3 rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-colors duration-[80ms] hover:border-blue/40"
    >
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={avatar_url ?? undefined} alt={full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[14px] font-bold text-text-1">
            {full_name}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(role)}>
              {getRoleLabel(role)}
            </Badge>
            <span className="font-mono text-[11px] text-text-3">
              {xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>
      {bio && (
        <p className="line-clamp-2 text-[13px] text-text-3">{bio}</p>
      )}
      {stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {stack.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-[2px] bg-bg-hover px-1.5 py-0.5 font-mono text-[10px] text-text-3"
            >
              {tag}
            </span>
          ))}
          {stack.length > 4 && (
            <span className="font-mono text-[10px] text-text-3">
              +{stack.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
