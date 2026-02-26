"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCatalog } from "@/store/catalog";
import { useVenues, Venue } from "@/store/venues";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Page";
import { Input, SecondaryButton, Button } from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

function namesByIds(ids: string[], all: { id: string; name: string }[]) {
  const map = new Map(all.map((x) => [x.id, x.name]));
  return ids.map((id) => map.get(id)).filter(Boolean).join(", ");
}

function isOpenNow(v: Venue) {
  try {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const day = ["sun","mon","tue","wed","thu","fri","sat"][now.getDay()] as any;

    // 1) виняток на конкретну дату має пріоритет
    const ex = v.schedule?.exceptions?.find((x) => x.date === iso);
    if (ex) {
      if (ex.isClosed) return false;
      const [oh, om] = (ex.open || "00:00").split(":").map(Number);
      const [ch, cm] = (ex.close || "00:00").split(":").map(Number);
      const start = new Date(now);
      start.setHours(oh, om, 0, 0);
      const end = new Date(now);
      end.setHours(ch, cm, 0, 0);
      return now >= start && now <= end;
    }

    // 2) звичайний тижневий графік
    const entry = v.schedule?.days?.find((d) => d.day === day);
    if (!entry || entry.isClosed) return false;

    const [oh, om] = entry.open.split(":").map(Number);
    const [ch, cm] = entry.close.split(":").map(Number);
    const start = new Date(now); start.setHours(oh, om, 0, 0);
    const end = new Date(now); end.setHours(ch, cm, 0, 0);
    return now >= start && now <= end;
  } catch {
    return false;
  }
}

export default function VenuesList({ cityId }: { cityId: string }) {
  const { getByCity } = useVenues();
  const { venueTypes, cuisineTypes } = useCatalog();

  const venues = getByCity(cityId);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return venues;
    return venues.filter((v) => (v.name + " " + v.slug).toLowerCase().includes(s));
  }, [venues, q]);

  if (!venues.length) {
    return (
      <EmptyState
        title="Поки немає закладів"
        description="Натисніть «Додати заклад», щоб створити перший."
        actions={
          <Link href={`/admin/c/${cityId}/venues/new`}>
            <Button type="button">+ Додати заклад</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title="Огляд закладів"
        subtitle="Табличний режим з колонками та сортуванням. Дії справа: Заклад / Меню."
        right={
          <div style={{ width: 340, maxWidth: "100%" }}>
            <div className="ui-field">
              <div className="ui-label">Пошук</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Назва або slug..." />
            </div>
          </div>
        }
      />

      <DataTable
        rows={filtered}
        getRowId={(v) => v.id}
        initialSortKey="name"
        initialSortDir="asc"
        columns={[
          {
            key: "name",
            header: "Заклад",
            sortable: true,
            sortValue: (v) => v.name,
            cell: (v) => (
              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 12, alignItems: "center" }}>
                <div className="ui-thumb">
                  {v.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.photoUrl} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="ui-subtitle">—</span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950 }}>{v.name}</div>
                  <div className="ui-subtitle">slug: <b>{v.slug}</b></div>
                </div>
              </div>
            ),
          },
          {
            key: "venueTypes",
            header: "Тип",
            sortable: true,
            sortValue: (v) => namesByIds(v.venueTypeIds, venueTypes),
            cell: (v) => <span className="ui-subtitle" style={{ fontWeight: 900 }}>{namesByIds(v.venueTypeIds, venueTypes) || "—"}</span>,
          },
          {
            key: "cuisineTypes",
            header: "Кухні",
            sortable: true,
            sortValue: (v) => namesByIds(v.cuisineTypeIds, cuisineTypes),
            cell: (v) => <span className="ui-subtitle" style={{ fontWeight: 900 }}>{namesByIds(v.cuisineTypeIds, cuisineTypes) || "—"}</span>,
          },
          {
            key: "status",
            header: "Статус",
            width: 140,
            sortable: true,
            sortValue: (v) => (isOpenNow(v) ? 1 : 0),
            cell: (v) => (isOpenNow(v) ? <Badge variant="ok">Відкрито</Badge> : <Badge variant="stop">Закрито</Badge>),
          },
          {
            key: "actions",
            header: "",
            width: 220,
            cell: (v) => (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Link href={`/admin/c/${cityId}/venues/${v.id}`}>
                  <SecondaryButton type="button">Заклад</SecondaryButton>
                </Link>
                <Link href={`/admin/c/${cityId}/venues/${v.id}/menu/venue-dishes`}>
                  <Button type="button">Меню</Button>
                </Link>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
