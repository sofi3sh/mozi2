"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useVenues } from "@/store/venues";
import { useMenu } from "@/store/menu";
import { Card } from "@/components/ui/Card";
import { Button, SecondaryButton } from "@/components/ui/Input";

export default function CityDashboardClient({ cityId }: { cityId: string }) {
  const { getByCity } = useVenues();
  const { dishes, categories, modifierGroups } = useMenu();

  const venues = getByCity(cityId);

  const stats = useMemo(() => {
    const cityDishes = dishes.filter((d) => d.cityId === cityId);
    const cityCats = categories.filter((c) => c.cityId === cityId);
    const cityGroups = modifierGroups.filter((g) => g.cityId === cityId);

    return {
      venues: venues.length,
      categories: cityCats.length,
      dishes: cityDishes.length,
      stopped: cityDishes.filter((d) => d.isStopped).length,
      groups: cityGroups.length,
    };
  }, [cityId, venues.length, dishes, categories, modifierGroups]);

  return (
    <div className="ui-grid">
      <div className="ui-kpis">
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Заклади</div>
          <div className="ui-kpiValue">{stats.venues}</div>
        </div>
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Категорії</div>
          <div className="ui-kpiValue">{stats.categories}</div>
        </div>
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Страви</div>
          <div className="ui-kpiValue">{stats.dishes}</div>
        </div>
      </div>

      <div className="ui-kpis">
        <div className="ui-kpi">
          <div className="ui-kpiLabel">В стоп-листі</div>
          <div className="ui-kpiValue">{stats.stopped}</div>
        </div>
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Групи модифікаторів</div>
          <div className="ui-kpiValue">{stats.groups}</div>
        </div>
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Замовлення</div>
          <div className="ui-kpiValue">—</div>
        </div>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 16 }}>Швидкі дії</div>
            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              Переходьте туди, куди найчастіше заходять адміністратори.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/admin/c/${cityId}/venues`}>
              <SecondaryButton type="button">Заклади</SecondaryButton>
            </Link>
            <Link href={`/admin/c/${cityId}/menu`}>
              <Button type="button">Меню</Button>
            </Link>
            <Link href={`/admin/c/${cityId}/orders`}>
              <SecondaryButton type="button">Замовлення</SecondaryButton>
            </Link>
            <Link href={`/admin/c/${cityId}/seo`}>
              <SecondaryButton type="button">SEO</SecondaryButton>
            </Link>
          </div>
        </div>
      </Card>

      {venues.length ? (
        <Card>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Останні заклади</div>
          <div className="ui-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {venues.slice(0, 4).map((v) => (
              <div key={v.id} className="ui-row" style={{ padding: 14 }}>
                <div style={{ fontWeight: 950 }}>{v.name}</div>
                <div className="ui-subtitle" style={{ marginTop: 6 }}>slug: <b>{v.slug}</b></div>
                <div className="ui-actions" style={{ marginTop: 10, justifyContent: "flex-start" }}>
                  <Link href={`/admin/c/${cityId}/venues/${v.id}/menu/venue-dishes`}>
                    <Button type="button">Страви закладу</Button>
                  </Link>
                  <Link href={`/admin/c/${cityId}/venues/${v.id}`}>
                    <SecondaryButton type="button">Заклад</SecondaryButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
