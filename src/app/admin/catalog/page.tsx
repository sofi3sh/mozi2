"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useCatalog } from "@/store/catalog";
import { useSession } from "@/store/session";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader, EmptyState } from "@/components/ui/Page";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";

function normName(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

export default function AdminCatalogPage() {
  const { user } = useSession();
  const { venueTypes, cuisineTypes, addVenueType, addCuisineType, updateItem, removeItem } = useCatalog();

  const canManage = user.role === "owner" || user.role === "admin";

  const [vtName, setVtName] = useState("");
  const [vtNameRu, setVtNameRu] = useState("");
  const [ctName, setCtName] = useState("");
  const [ctNameRu, setCtNameRu] = useState("");

  const canAddVt = useMemo(() => normName(vtName).length >= 2, [vtName]);
  const canAddCt = useMemo(() => normName(ctName).length >= 2, [ctName]);

  function addVt() {
    if (!canAddVt) return;
    addVenueType({ name: vtName, nameRu: vtNameRu });
    setVtName("");
    setVtNameRu("");
  }

  function addCt() {
    if (!canAddCt) return;
    addCuisineType({ name: ctName, nameRu: ctNameRu });
    setCtName("");
    setCtNameRu("");
  }

  if (!canManage) {
    return (
      <div className="ui-grid">
        <PageHeader
          title="Каталог"
          description="Типи закладів та кухонь."
          actions={
            <Link href="/admin/menu">
              <SecondaryButton type="button">Назад</SecondaryButton>
            </Link>
          }
        />
        <EmptyState title="Недостатньо прав" description="Цей розділ доступний тільки Owner/Admin." />
      </div>
    );
  }

  return (
    <div className="ui-grid">
      <PageHeader
        title="Каталог"
        description="Редагування типів закладів та кухонь (UA/RU)."
        actions={
          <Link href="/admin/menu">
            <SecondaryButton type="button">На головну</SecondaryButton>
          </Link>
        }
      />

      <div className="ui-twoCol">
        <Card>
          <CardHeader title="Типи закладів" subtitle="Використовуються у фільтрах та на сторінці категорій." />

          <div className="ui-grid">
            <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr auto auto", gap: 10, alignItems: "end" }}>
              <div className="ui-field">
                <div className="ui-label">Назва (UA)</div>
                <Input value={vtName} onChange={(e) => setVtName(e.target.value)} placeholder="Напр. Кафе" />
              </div>
              <div className="ui-field">
                <div className="ui-label">Назва (RU)</div>
                <Input value={vtNameRu} onChange={(e) => setVtNameRu(e.target.value)} placeholder="Напр. Кафе" />
              </div>
              <Button type="button" onClick={addVt} disabled={!canAddVt} style={{ height: 42 }}>
                Додати
              </Button>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setVtName("");
                  setVtNameRu("");
                }}
                style={{ height: 42 }}
              >
                Очистити
              </SecondaryButton>
            </div>

            <div className="ui-divider" />

            {!venueTypes.length ? (
              <div className="ui-subtitle">Поки немає типів.</div>
            ) : (
              <div className="ui-grid">
                {venueTypes.map((it) => (
                  <CatalogRow
                    key={it.id}
                    item={it}
                    badge="venueType"
                    onUpdate={(patch) => updateItem(it.id, patch)}
                    onDelete={() => removeItem(it.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Типи кухонь" subtitle="Використовуються у фільтрах." />

          <div className="ui-grid">
            <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr auto auto", gap: 10, alignItems: "end" }}>
              <div className="ui-field">
                <div className="ui-label">Назва (UA)</div>
                <Input value={ctName} onChange={(e) => setCtName(e.target.value)} placeholder="Напр. Українська" />
              </div>
              <div className="ui-field">
                <div className="ui-label">Назва (RU)</div>
                <Input value={ctNameRu} onChange={(e) => setCtNameRu(e.target.value)} placeholder="Напр. Украинская" />
              </div>
              <Button type="button" onClick={addCt} disabled={!canAddCt} style={{ height: 42 }}>
                Додати
              </Button>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setCtName("");
                  setCtNameRu("");
                }}
                style={{ height: 42 }}
              >
                Очистити
              </SecondaryButton>
            </div>

            <div className="ui-divider" />

            {!cuisineTypes.length ? (
              <div className="ui-subtitle">Поки немає типів.</div>
            ) : (
              <div className="ui-grid">
                {cuisineTypes.map((it) => (
                  <CatalogRow
                    key={it.id}
                    item={it}
                    badge="cuisineType"
                    onUpdate={(patch) => updateItem(it.id, patch)}
                    onDelete={() => removeItem(it.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CatalogRow({
  item,
  badge,
  onUpdate,
  onDelete,
}: {
  item: { id: string; name: string; nameRu?: string };
  badge: string;
  onUpdate: (patch: { name?: string; nameRu?: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [nameRu, setNameRu] = useState(item.nameRu ?? "");
  const canSave = useMemo(() => normName(name).length >= 2, [name]);

  return (
    <div className="ui-row">
      <div style={{ display: "flex", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px", minWidth: 280 }}>
          {editing ? (
            <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="ui-field" style={{ margin: 0 }}>
                <div className="ui-label">UA</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="ui-field" style={{ margin: 0 }}>
                <div className="ui-label">RU</div>
                <Input value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950 }}>{item.name}</div>
              {item.nameRu ? <div style={{ opacity: 0.75 }}>RU: {item.nameRu}</div> : <div style={{ opacity: 0.5 }}>RU: —</div>}
              <Badge variant="default">{badge}</Badge>
              <div className="ui-subtitle">ID: {item.id}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
          {editing ? (
            <>
              <Button
                type="button"
                disabled={!canSave}
                onClick={() => {
                  onUpdate({ name: name.trim(), nameRu: nameRu.trim() });
                  setEditing(false);
                }}
              >
                Зберегти
              </Button>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setName(item.name);
                  setNameRu(item.nameRu ?? "");
                  setEditing(false);
                }}
              >
                Скасувати
              </SecondaryButton>
            </>
          ) : (
            <SecondaryButton type="button" onClick={() => setEditing(true)}>
              Редагувати
            </SecondaryButton>
          )}

          <SecondaryButton type="button" onClick={onDelete} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            Видалити
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

