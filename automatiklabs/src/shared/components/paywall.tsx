import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import {
  type SubscriptionTier,
  getTierLabel,
} from "@/shared/lib/auth/subscriptions";
import { LockKeyholeIcon, SparklesIcon } from "lucide-react";

interface PaywallProps {
  requiredTier: SubscriptionTier;
  title?: string;
  description?: string;
  className?: string;
}

export function Paywall({
  requiredTier,
  title,
  description,
  className,
}: PaywallProps) {
  const tierLabel = getTierLabel(requiredTier);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 rounded-[2px] border-2 border-border bg-bg-inset p-10 text-center ${className ?? ""}`}
    >
      <div className="flex size-14 items-center justify-center rounded-[2px] border-2 border-border bg-bg">
        <LockKeyholeIcon className="size-7 text-text-3" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
          {title ?? `Conteudo ${tierLabel}`}
        </h2>
        <p className="max-w-[400px] text-[14px] leading-[1.6] text-text-2">
          {description ??
            `Este conteudo requer uma assinatura ${tierLabel}. Faca upgrade para acessar todas as aulas e recursos.`}
        </p>
      </div>

      <Button asChild size="lg">
        <Link href="/pricing">
          <SparklesIcon className="size-4" />
          Upgrade para {tierLabel}
        </Link>
      </Button>

      <p className="font-mono text-[11px] text-text-3">
        {">"} acesso imediato apos upgrade
      </p>
    </div>
  );
}

export default Paywall;
