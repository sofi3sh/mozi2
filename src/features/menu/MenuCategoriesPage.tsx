"use client";

import React, { useMemo, useState } from "react";
import { useMenu } from "@/store/menu";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";

export default function MenuCategoriesPage({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getCategories, addCategory, updateCategory, removeCategory, getDishes } = useMenu();

  const categories = getCategories(cityId, venueId);
  const dishes = getDishes(cityId, venueId);

  const [name, setName] = useState("");
  const [sort, setSort] = useState("10");

  const canAdd = useMemo(() => name.trim().length >= 2, [name]);

  const dishCountByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dishes) m.set(d.categoryId, (m.get(d.categoryId) ?? 0) + 1);
    return m;
  }, [dishes]);

  async function add() {
    if (!canAdd) return;
    await addCategory({
      cityId,
      venueId,
      name: name.trim(),
      sort: Number(sort || 0),
    });
    setName("");
    setSort("10");
  }

  return (
    <div className="ui-twoCol">
      <Card>
        <CardHeader
          title="Категорії"
          subtitle={
            <>
              Категорії потрібні, щоб групувати страви (наприклад: <b>Чебуреки</b>, <b>Піцца</b>, <b>Напої</b>).
            </>
          }
        />

        <div className="ui-grid">
          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 140px", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Назва</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Чебуреки" />
            </div>
            <div className="ui-field">
              <div className="ui-label">Сортування</div>
              <Input type="number" value={sort} onChange={(e) => setSort(e.target.value)} />
            </div>
          </div>

          <div className="ui-actions">
            <Button type="button" onClick={add} disabled={!canAdd}>
              Додати категорію
            </Button>
          </div>

          <div className="ui-subtitle">
            Порада: на сторінці <b>“Страви”</b> модифікатори та варіанти підʼєднуються до страви через групи.
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Список категорій" subtitle="Редагуйте назву/сортування або видаляйте категорії." />

        {!categories.length ? (
          <div className="ui-subtitle">Поки немає категорій.</div>
        ) : (
          <div className="ui-grid">
            {categories.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                dishesCount={dishCountByCat.get(c.id) ?? 0}
                onUpdate={updateCategory}
                onRemove={removeCategory}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CategoryRow({
  category,
  dishesCount,
  onUpdate,
  onRemove,
}: {
  category: any;
  dishesCount: number;
  onUpdate: (id: string, patch: any) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [sort, setSort] = useState(String(category.sort ?? 0));

  function save() {
    onUpdate(category.id, {
      name: name.trim(),
      sort: Number(sort || 0),
    });
    setEditing(false);
  }

  return (
    <div className="ui-row">
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          {editing ? (
            <div className="ui-grid" style={{ gridTemplateColumns: "1fr 140px", gap: 10 }}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Input type="number" value={sort} onChange={(e) => setSort(e.target.value)} />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>{category.name}</div>
              <Badge variant="default">sort: {category.sort ?? 0}</Badge>
              <Badge variant={dishesCount ? "default" : "stop"}>{dishesCount} страв</Badge>
            </div>
          )}
        </div>

        <div className="ui-actions" style={{ justifyContent: "flex-end" }}>
          {editing ? (
            <>
              <Button type="button" onClick={save}>
                Зберегти
              </Button>
              <SecondaryButton type="button" onClick={() => setEditing(false)}>
                Скасувати
              </SecondaryButton>
            </>
          ) : (
            <>
              <SecondaryButton type="button" onClick={() => setEditing(true)}>
                Редагувати
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => onRemove(category.id)}>
                Видалити
              </SecondaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
