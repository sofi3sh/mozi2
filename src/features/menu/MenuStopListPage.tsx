"use client";

import React, { useMemo, useState } from "react";
import { useMenu } from "@/store/menu";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { SecondaryButton, Input } from "@/components/ui/Input";

export default function MenuStopListPage({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getDishes, getGroups, setDishStopped, setOptionStopped } = useMenu();
  const dishes = getDishes(cityId, venueId);
  const groups = getGroups(cityId, venueId);

  const [q, setQ] = useState("");

  const filteredDishes = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return dishes;
    return dishes.filter((d) => d.name.toLowerCase().includes(s));
  }, [dishes, q]);

  const filteredGroups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return groups;
    return groups
      .map((g) => ({
        ...g,
        options: g.options.filter((o) => (g.title + " " + o.name).toLowerCase().includes(s)),
      }))
      .filter((g) => g.options.length);
  }, [groups, q]);

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title="Стоп-лист"
          subtitle="Швидко вмикайте/вимикайте страви та опції модифікаторів. Це зручно, коли щось тимчасово закінчилось."
          right={
            <div style={{ minWidth: 300 }}>
              <div className="ui-field">
                <div className="ui-label">Пошук</div>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Почніть вводити назву..." />
              </div>
            </div>
          }
        />
      </Card>

      <div className="ui-twoCol">
        <Card>
          <CardHeader title="Страви" subtitle="Позначайте страви як STOP, щоб приховати їх із замовлення." />

          {!filteredDishes.length ? (
            <div className="ui-subtitle">Нічого не знайдено.</div>
          ) : (
            <div className="ui-grid">
              {filteredDishes.map((d) => (
                <div key={d.id} className="ui-row">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {d.name}
                        {d.isStopped ? <Badge variant="stop">STOP</Badge> : <Badge variant="ok">OK</Badge>}
                      </div>
                      <div className="ui-subtitle" style={{ marginTop: 4 }}>
                        Статус: {d.isStopped ? "в стоп-листі" : "в наявності"}
                      </div>
                    </div>
                    <div className="ui-actions">
                      <SecondaryButton type="button" onClick={() => setDishStopped(d.id, !d.isStopped)}>
                        {d.isStopped ? "Повернути" : "В стоп-лист"}
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Опції модифікаторів" subtitle="Стоп по опціях (наприклад, “Соус BBQ” тимчасово недоступний)." />

          {!filteredGroups.length ? (
            <div className="ui-subtitle">Нічого не знайдено.</div>
          ) : (
            <div className="ui-grid">
              {filteredGroups.map((g) => (
                <div key={g.id} className="ui-row" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 950, marginBottom: 8 }}>{g.title}</div>

                  <div className="ui-grid">
                    {g.options.map((o) => (
                      <div key={o.id} className="ui-row" style={{ padding: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              {o.name}
                              {o.isStopped ? <Badge variant="stop">STOP</Badge> : <Badge variant="ok">OK</Badge>}
                            </div>
                            <div className="ui-subtitle" style={{ marginTop: 4 }}>
                              Статус: {o.isStopped ? "в стоп-листі" : "в наявності"}
                            </div>
                          </div>
                          <div className="ui-actions">
                            <SecondaryButton type="button" onClick={() => setOptionStopped(g.id, o.id, !o.isStopped)}>
                              {o.isStopped ? "Повернути" : "В стоп-лист"}
                            </SecondaryButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="ui-subtitle" style={{ marginTop: 10 }}>
            У реальному бекенді стоп-лист часто має терміни/причини, але тут — простий прапорець для MVP.
          </div>
        </Card>
      </div>
    </div>
  );
}
