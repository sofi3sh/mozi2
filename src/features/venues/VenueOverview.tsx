"use client";

import Link from "next/link";
import { useCatalog } from "@/store/catalog";
import { useVenues } from "@/store/venues";
import { Card, CardHeader } from "@/components/ui/Card";
import { SecondaryButton, Button } from "@/components/ui/Input";

function namesByIds(ids: string[], all: { id: string; name: string }[]) {
  const map = new Map(all.map((x) => [x.id, x.name]));
  return ids.map((id) => map.get(id)).filter(Boolean).join(", ");
}

export default function VenueOverview({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getById } = useVenues();
  const { venueTypes, cuisineTypes } = useCatalog();
  const venue = getById(venueId);

  if (!venue || venue.cityId !== cityId) return null;

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title="Огляд"
          subtitle="Основні дані закладу. Для змін — відкрийте «Редагувати» або вкладки Графік/Медіа/Меню."
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/admin/c/${cityId}/venues/${venueId}/menu/venue-dishes`}>
                <Button type="button">Страви закладу</Button>
              </Link>
              <Link href={`/admin/c/${cityId}/venues/${venueId}/edit`}>
                <SecondaryButton type="button">Редагувати</SecondaryButton>
              </Link>
            </div>
          }
        />

        <div className="ui-grid" style={{ gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }}>
          <div className="ui-grid">
            <div className="ui-field">
              <div className="ui-label">Опис</div>
              <div style={{ fontWeight: 700 }}>{venue.description || "—"}</div>
            </div>

            <div className="ui-field">
              <div className="ui-label">Типи закладів</div>
              <div style={{ fontWeight: 700 }}>{venue.venueTypeIds.length ? namesByIds(venue.venueTypeIds, venueTypes) : "—"}</div>
            </div>

            <div className="ui-field">
              <div className="ui-label">Типи кухонь</div>
              <div style={{ fontWeight: 700 }}>{venue.cuisineTypeIds.length ? namesByIds(venue.cuisineTypeIds, cuisineTypes) : "—"}</div>
            </div>
          </div>

          <div className="ui-grid">
            <div className="ui-label">Фото</div>
            <div className="ui-preview">
              {venue.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={venue.photoUrl} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="ui-subtitle">Фото не додано</div>
              )}
            </div>

            <div className="ui-row">
              <div className="ui-label">Slug</div>
              <div style={{ fontWeight: 950, marginTop: 6 }}>{venue.slug}</div>
              <div className="ui-subtitle" style={{ marginTop: 6 }}>
                Використовується в URL сторінки закладу.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
