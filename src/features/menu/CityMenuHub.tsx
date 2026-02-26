"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useVenues } from "@/store/venues";
import { useCityScope } from "@/store/cityScope";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, EmptyState } from "@/components/ui/Page";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";

export default function CityMenuHub({ cityId }: { cityId: string }) {
  const { getByCity } = useVenues();
  const { cities } = useCityScope();
  const cityName = cities.find((c) => c.id === cityId)?.name ?? cityId;

  const [q, setQ] = useState("");
  const venues = getByCity(cityId);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return venues;
    return venues.filter((v) => (v.name + " " + v.slug).toLowerCase().includes(s));
  }, [venues, q]);

  return (
    <div className="ui-grid">
      <PageHeader
        title={`Меню — ${cityName}`}
        description="Оберіть заклад і керуйте категоріями, стравами, варіаціями та інгредієнтами. Все тут — тільки для цього міста."
        actions={
          <Link href={`/admin/c/${cityId}/venues/new`}>
            <Button type="button">+ Додати заклад</Button>
          </Link>
        }
      />

      {!venues.length ? (
        <EmptyState
          title="У місті ще немає закладів"
          description="Створіть перший заклад, щоб додавати категорії та страви."
          actions={
            <Link href={`/admin/c/${cityId}/venues/new`}>
              <Button type="button">Створити заклад</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardHeader
            title="Заклади"
            subtitle="Клікніть «Страви закладу» для управління списком, або «Страви + Варіації» — щоб створити нову страву та налаштувати варіації."
            right={
              <div style={{ width: 320, maxWidth: "100%" }}>
                <div className="ui-field">
                  <div className="ui-label">Пошук</div>
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Назва або slug..." />
                </div>
              </div>
            }
          />

          <div className="ui-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {filtered.map((v) => (
              <div key={v.id} className="ui-row" style={{ padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 12, alignItems: "center" }}>
                  <div className="ui-thumb" style={{ width: 92, height: 66 }}>
                    {v.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photoUrl} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span className="ui-subtitle">—</span>
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 950, fontSize: 15 }}>{v.name}</div>
                    <div className="ui-subtitle" style={{ marginTop: 4 }}>
                      slug: <b>{v.slug}</b>
                    </div>
                    {v.description ? (
                      <div className="ui-subtitle" style={{ marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v.description}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="ui-divider" style={{ margin: "12px 0" }} />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href={`/admin/c/${cityId}/venues/${v.id}`}>
                    <SecondaryButton type="button">Заклад</SecondaryButton>
                  </Link>
                  <Link href={`/admin/c/${cityId}/venues/${v.id}/menu/venue-dishes`}>
                    <Button type="button">Страви закладу</Button>
                  </Link>
                  <Link href={`/admin/c/${cityId}/venues/${v.id}/menu/dishes`}>
                    <SecondaryButton type="button">Страви + Варіації</SecondaryButton>
                  </Link>
                  <Link href={`/admin/c/${cityId}/venues/${v.id}/menu/categories`}>
                    <SecondaryButton type="button">Категорії</SecondaryButton>
                  </Link>
                  <Link href={`/admin/c/${cityId}/venues/${v.id}/menu/ingredients`}>
                    <SecondaryButton type="button">Інгредієнти</SecondaryButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
