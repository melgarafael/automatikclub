"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  getTierLabel,
  getTierBadgeVariant,
} from "@/shared/lib/auth/subscriptions";
import type { SubscriptionTier } from "@/shared/lib/auth/subscriptions";
import { CreditCardIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

interface SubscriptionSettingsProps {
  tier: SubscriptionTier;
}

export function SubscriptionSettings({ tier }: SubscriptionSettingsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Current Plan */}
      <div className="rounded-[2px] border-2 border-border bg-bg-inset p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-[13px] font-medium text-text-3">
              Plano atual
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-[18px] font-bold text-text-1">
                {getTierLabel(tier)}
              </span>
              <Badge variant={getTierBadgeVariant(tier)}>
                {getTierLabel(tier)}
              </Badge>
            </div>
          </div>
          {tier !== "free" && (
            <Button variant="outline" size="sm">
              <CreditCardIcon className="size-4" />
              Gerenciar assinatura
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade CTA */}
      {tier !== "premium" && (
        <div className="rounded-[2px] border-2 border-blue/30 bg-blue-dim/30 p-5">
          <h3 className="font-display text-[14px] font-bold text-text-1">
            {tier === "free" ? "Desbloqueie mais recursos" : "Faca upgrade"}
          </h3>
          <p className="mt-1 text-[13px] text-text-3">
            {tier === "free"
              ? "Com o plano Pro voce acessa cursos exclusivos, templates e muito mais."
              : "Com o Premium voce tem acesso total a plataforma, mentorias e canal exclusivo."}
          </p>
          <Button asChild className="mt-3">
            <Link href="/pricing">
              <SparklesIcon className="size-4" />
              Ver planos
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
