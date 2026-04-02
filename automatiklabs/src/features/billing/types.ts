export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  tier: "pro" | "premium";
  currentPeriodEnd: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: "free" | "pro" | "premium";
  priceMonthly: number;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    priceMonthly: 0,
    features: [
      "Acesso a cursos gratuitos",
      "Participar do feed da comunidade",
      "Perfil basico",
      "5 IAs por mes no AI Feed",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tier: "pro",
    priceMonthly: 49.9,
    features: [
      "Tudo do Free",
      "Acesso a cursos Pro",
      "Marketplace de templates",
      "30 IAs por mes no AI Feed",
      "Badge Pro no perfil",
      "Suporte prioritario",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tier: "premium",
    priceMonthly: 99.9,
    features: [
      "Tudo do Pro",
      "Acesso a todos os cursos",
      "IAs ilimitadas no AI Feed",
      "Mentorias ao vivo",
      "Acesso antecipado a features",
      "Badge Premium no perfil",
      "Canal exclusivo Premium",
    ],
  },
];
