import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { CheckIcon, SparklesIcon } from "lucide-react";
import { PRICING_PLANS } from "../types";

export function PricingTable() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {PRICING_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`flex flex-col rounded-[2px] border-2 p-6 ${
            plan.tier === "pro"
              ? "border-blue bg-bg-raised"
              : "border-border bg-bg-raised"
          }`}
        >
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-display text-[18px] font-bold text-text-1">
              {plan.name}
            </h3>
            {plan.tier === "pro" && <Badge variant="pro">Popular</Badge>}
            {plan.tier === "premium" && <Badge variant="admin">Premium</Badge>}
          </div>

          <div className="mb-6">
            <span className="font-display text-[32px] font-bold text-text-1">
              {plan.priceMonthly === 0
                ? "Gratis"
                : `R$${plan.priceMonthly.toFixed(2).replace(".", ",")}`}
            </span>
            {plan.priceMonthly > 0 && (
              <span className="text-[13px] text-text-3">/mes</span>
            )}
          </div>

          <ul className="mb-6 flex flex-1 flex-col gap-2">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-[13px] text-text-2"
              >
                <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-green" />
                {feature}
              </li>
            ))}
          </ul>

          {plan.tier === "free" ? (
            <Button variant="outline" className="w-full" disabled>
              Plano atual
            </Button>
          ) : (
            <Button
              className={`w-full ${
                plan.tier === "premium"
                  ? "bg-amber text-black hover:shadow-[0_0_0_4px_rgba(240,160,48,0.15)]"
                  : ""
              }`}
            >
              <SparklesIcon className="size-4" />
              Assinar {plan.name}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
