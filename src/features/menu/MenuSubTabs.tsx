"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { label: string; href: string };

export default function MenuSubTabs({ cityId, venueId }: { cityId: string; venueId: string }) {
  const pathname = usePathname();

  const base = `/admin/c/${cityId}/venues/${venueId}/menu`;
  const tabs: Tab[] = [
    { label: "Категорії", href: `${base}/categories` },
    { label: "Страви закладу", href: `${base}/venue-dishes` },
    { label: "Страви + Варіації", href: `${base}/dishes` },
    { label: "Універсальні варіації", href: `${base}/variations` },
    { label: "Інгредієнти", href: `${base}/ingredients` },
  ];

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel)",
        borderRadius: 16,
        padding: 8,
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        position: "sticky",
        top: 10,
        zIndex: 5,
        boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
      }}
    >
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              padding: "10px 12px",
              borderRadius: 999,
              fontWeight: 950,
              border: active ? "1px solid rgba(59,130,246,0.45)" : "1px solid transparent",
              background: active ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.03)",
              transition: "transform 120ms ease, background 120ms ease",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
