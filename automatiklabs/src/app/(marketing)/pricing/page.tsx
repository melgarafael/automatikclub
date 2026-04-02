import { PricingTable } from "@/features/billing/components/pricing-table";

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-display text-[32px] font-bold tracking-[-0.03em] text-text-1">
          Escolha seu plano
        </h1>
        <p className="mt-2 text-[14px] text-text-3">
          Desbloqueie todo o potencial do AutomatikClub
        </p>
      </div>
      <PricingTable />
    </section>
  );
}
