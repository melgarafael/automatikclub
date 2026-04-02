"use client";

import { useTier } from "@/features/billing/hooks/use-tier";
import { type SubscriptionTier, getTierLabel } from "@/shared/lib/auth/subscriptions";
import { Button } from "@/shared/components/ui/button";
import { LockKeyholeIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier: SubscriptionTier;
  fallback?: React.ReactNode;
}

export function SubscriptionGuard({
  children,
  requiredTier,
  fallback,
}: SubscriptionGuardProps) {
  const { hasTier, isLoading } = useTier();

  if (isLoading) {
    return null;
  }

  if (!hasTier(requiredTier)) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[2px] border-2 border-border bg-bg-inset p-8">
        <div className="flex size-12 items-center justify-center rounded-[2px] bg-bg-hover">
          <LockKeyholeIcon className="size-6 text-text-3" />
        </div>
        <div className="text-center">
          <p className="font-display text-[16px] font-bold text-text-1">
            Conteudo {getTierLabel(requiredTier)}
          </p>
          <p className="mt-1 text-[13px] text-text-3">
            Faca upgrade para {getTierLabel(requiredTier)} para acessar este
            conteudo.
          </p>
        </div>
        <Button asChild>
          <Link href="/pricing">
            <SparklesIcon className="size-4" />
            Fazer upgrade
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
