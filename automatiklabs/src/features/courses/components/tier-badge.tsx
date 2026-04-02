import { Badge } from "@/shared/components/ui/badge";
import {
  type SubscriptionTier,
  getTierLabel,
  getTierBadgeVariant,
} from "@/shared/lib/auth/subscriptions";
import { LockKeyholeIcon } from "lucide-react";

interface TierBadgeProps {
  tier: SubscriptionTier;
  locked?: boolean;
  className?: string;
}

export function TierBadge({ tier, locked, className }: TierBadgeProps) {
  if (tier === "free") return null;

  return (
    <Badge variant={getTierBadgeVariant(tier)} className={className}>
      {locked && <LockKeyholeIcon className="size-3" />}
      {getTierLabel(tier)}
    </Badge>
  );
}

export default TierBadge;
