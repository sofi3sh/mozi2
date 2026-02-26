"use client";

import Link from "next/link";
import { useVenues } from "@/store/venues";
import { Card, CardHeader } from "@/components/ui/Card";
import { SecondaryButton } from "@/components/ui/Input";

const labels: Record<string, string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Нд",
};

export default function VenueScheduleTab({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getById } = useVenues();
  const venue = getById(venueId);
  if (!venue || venue.cityId !== cityId) return null;

  // ✅ WorkSchedule -> беремо days
  // + fallback на старий формат (якщо в кеші/даних ще WorkDay[])
  const days =
    (venue.schedule as any)?.days && Array.isArray((venue.schedule as any).days)
      ? (venue.schedule as any).days
      : Array.isArray(venue.schedule as any)
        ? (venue.schedule as any)
        : [];

  return (
    <Card>
      <CardHeader
        title="Графік роботи"
        subtitle="Перегляд поточного графіка. Для редагування — відкрийте «Редагувати»."
        right={
          <Link href={`/admin/c/${cityId}/venues/${venueId}/edit`}>
            <SecondaryButton type="button">Редагувати</SecondaryButton>
          </Link>
        }
      />

      <div className="ui-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {days.map((d: any) => (
          <div
            key={d.day}
            className="ui-row"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ fontWeight: 950 }}>{labels[d.day] ?? d.day}</div>
            <div className="ui-subtitle">
              {d.isClosed ? <b>Зачинено</b> : <b>{d.open}–{d.close}</b>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
