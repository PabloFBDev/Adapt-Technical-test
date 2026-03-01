import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/60 mb-5"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors tracking-wider uppercase"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground/80 tracking-wider uppercase">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
