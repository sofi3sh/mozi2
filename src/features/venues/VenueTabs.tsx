"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { key: string; label: string; href: string };

export default function VenueTabs({ cityId, venueId }: { cityId: string; venueId: string }) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { key: "overview", label: "Основне", href: `/admin/c/${cityId}/venues/${venueId}` },
    { key: "edit", label: "Редагувати", href: `/admin/c/${cityId}/venues/${venueId}/edit` },
    { key: "menu", label: "Меню", href: `/admin/c/${cityId}/venues/${venueId}/menu/venue-dishes` },
  ];

  return (
    <div className="ui-tabsBar">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.key}
            href={t.href}
            className={active ? "ui-tab ui-tab--active" : "ui-tab"}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
