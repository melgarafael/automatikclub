import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={`pb-4 pt-5 font-mono text-[12px] text-text-3 ${className ?? ""}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <span key={item.label}>
          {index > 0 && (
            <span className="mx-1 text-text-3">/</span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-blue hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-2">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;
