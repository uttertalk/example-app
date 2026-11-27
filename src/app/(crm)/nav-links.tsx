"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/leads", label: "Leads" },
  { href: "/deals", label: "Deals" },
  { href: "/contacts", label: "Contacts" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-[6px] px-2.5 py-1.5 text-[13px] ${
              active ? "bg-panel-2 font-medium text-ink" : "text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
