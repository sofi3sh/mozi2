"use client";

import Link from "next/link";
import { useVenues } from "@/store/venues";
import { Card, CardHeader } from "@/components/ui/Card";
import { SecondaryButton } from "@/components/ui/Input";

export default function VenueMediaTab({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getById } = useVenues();
  const venue = getById(venueId);
  if (!venue || venue.cityId !== cityId) return null;

  return (
    <Card>
      <CardHeader
        title="Медіа"
        subtitle="Поки що — 1 фото. Далі додамо галерею, сортування, alt-тексти, cover."
        right={
          <Link href={`/admin/c/${cityId}/venues/${venueId}/edit`}>
            <SecondaryButton type="button">Редагувати</SecondaryButton>
          </Link>
        }
      />

      <div className="ui-preview">
        {venue.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.photoUrl} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="ui-subtitle">Фото не додано</div>
        )}
      </div>

      <div className="ui-subtitle" style={{ marginTop: 10 }}>
        Наступним кроком: кілька фото, drag&drop порядок, обрізка, оптимізація, alt/SEO.
      </div>
    </Card>
  );
}
