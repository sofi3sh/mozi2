"use client";

import Link from "next/link";
import { useVenues } from "@/store/venues";
import { Card } from "@/components/ui/Card";
import { Button, SecondaryButton } from "@/components/ui/Input";

export default function VenueHeader({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getById } = useVenues();
  const venue = getById(venueId);

  if (!venue || venue.cityId !== cityId) {
    return (
      <Card>
        <div style={{ fontWeight: 950, fontSize: 16 }}>Заклад не знайдено</div>
        <div className="ui-subtitle" style={{ marginTop: 8 }}>
          Перевірте URL або поверніться до списку закладів.
        </div>
        <div className="ui-actions" style={{ marginTop: 14, justifyContent: "flex-start" }}>
          <Link href={`/admin/c/${cityId}/venues`}>
            <Button type="button">← До закладів</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Заклад
          </div>
          <div style={{ fontWeight: 950, fontSize: 22, marginTop: 6, lineHeight: 1.15 }}>{venue.name}</div>
          <div className="ui-subtitle" style={{ marginTop: 8 }}>
            Місто: <b>{cityId}</b> • slug: <b>{venue.slug}</b>
          </div>
        </div>

        <div className="ui-actions">
          <Link href={`/admin/c/${cityId}/venues`}>
            <SecondaryButton type="button">До списку</SecondaryButton>
          </Link>
          <Link href={`/admin/c/${cityId}/venues/${venueId}/menu/venue-dishes`}>
            <Button type="button">Страви закладу</Button>
          </Link>
          <Link href={`/admin/c/${cityId}/venues/${venueId}/edit`}>
            <SecondaryButton type="button">Редагувати</SecondaryButton>
          </Link>
        </div>
      </div>
    </Card>
  );
}
