interface StatsCardProps {
  label: string;
  value: number | string;
  trend?: { value: number; positive: boolean };
  href?: string;
}

export function StatsCard({ label, value, trend, href }: StatsCardProps) {
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-colors duration-[80ms] hover:border-text-3"
    >
      <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
        {label}
      </p>
      <p className="font-mono text-[28px] font-bold tracking-[-0.02em] text-text-1">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
      {trend && (
        <p
          className={`mt-1 font-mono text-[11px] ${
            trend.positive ? "text-green" : "text-red"
          }`}
        >
          {trend.positive ? "+" : ""}
          {trend.value}%
        </p>
      )}
    </Wrapper>
  );
}

export default StatsCard;
