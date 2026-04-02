"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  hasMinTier,
  type SubscriptionTier,
} from "@/shared/lib/auth/subscriptions";

interface UseTierReturn {
  tier: SubscriptionTier | null;
  isLoading: boolean;
  hasTier: (requiredTier: SubscriptionTier) => boolean;
  isPro: boolean;
  isPremium: boolean;
  isFree: boolean;
}

export function useTier(): UseTierReturn {
  const { user, isLoading } = useAuth();

  const tier = user?.subscription_level ?? null;

  const hasTier = (requiredTier: SubscriptionTier): boolean => {
    if (!tier) return false;
    return hasMinTier(tier, requiredTier);
  };

  return {
    tier,
    isLoading,
    hasTier,
    isPro: hasTier("pro"),
    isPremium: hasTier("premium"),
    isFree: tier === "free",
  };
}
