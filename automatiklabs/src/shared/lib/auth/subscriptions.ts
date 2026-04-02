export const TIER_HIERARCHY = {
  free: 0,
  pro: 1,
  premium: 2,
} as const;

export type SubscriptionTier = keyof typeof TIER_HIERARCHY;

export function hasMinTier(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

export function getTierLabel(tier: SubscriptionTier): string {
  const labels: Record<SubscriptionTier, string> = {
    free: "Free",
    pro: "Pro",
    premium: "Premium",
  };
  return labels[tier];
}

export function getTierBadgeVariant(
  tier: SubscriptionTier
): "default" | "pro" | "admin" {
  const variants: Record<SubscriptionTier, "default" | "pro" | "admin"> = {
    free: "default",
    pro: "pro",
    premium: "admin",
  };
  return variants[tier];
}
