"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMenu } from "@/store/menu";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton, Textarea, Select } from "@/components/ui/Input";
import { uploadImage } from "@/lib/uploadClient";

function money(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("uk-UA").format(n);
}

function isVariationGroupTitle(title: string) {
  return String(title || "").startsWith("VAR::");
}

function cleanVariationTitle(title: string) {
  return String(title || "").replace(/^VAR::\s*/i, "");
}

function getDishVariationGroupId(modifierGroupIds: any, variationIds: Set<string>) {
  const ids = Array.isArray(modifierGroupIds) ? modifierGroupIds.map(String) : [];
  return ids.find((id) => variationIds.has(id)) || "";
}

function getDishIngredientGroupIds(modifierGroupIds: any, variationId: string) {
  const ids = Array.isArray(modifierGroupIds) ? modifierGroupIds.map(String) : [];
  return ids.filter((id) => id && id !== variationId);
}

export default function MenuVenueDishesPage({ cityId, venueId }: { cityId: string; venueId: string }) {
  const {
    getCategories,
    getDishes,
    getGroups,
    updateDish,
    removeDish,
    setDishStopped,
  } = useMenu();

  const categories = getCategories(cityId, venueId);
  const dishes = getDishes(cityId, venueId);
  const allGroups = getGroups(cityId, venueId);

  const variationGroups = useMemo(() => allGroups.filter((g) => isVariationGroupTitle(g.title)), [allGroups]);
  const ingredientGroups = useMemo(() => allGroups.filter((g) => !isVariationGroupTitle(g.title)), [allGroups]);
  const variationIds = useMemo(() => new Set(variationGroups.map((g) => g.id)), [variationGroups]);
  const groupById = useMemo(() => new Map(allGroups.map((g) => [g.id, g])), [allGroups]);
  const groupTitleById = useMemo(() => new Map(allGroups.map((g) => [g.id, g.title])), [allGroups]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const [q, setQ] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  const visibleDishes = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = filterCategoryId ? dishes.filter((d) => d.categoryId === filterCategoryId) : dishes;
    if (s) list = list.filter((d) => String(d.name || "").toLowerCase().includes(s));
    return list;
  }, [dishes, filterCategoryId, q]);

  // Edit state
  const [editDishId, setEditDishId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<null | {
    name: string;
    description: string;
    categoryId: string;
    price: string;
    photoUrl: string;
    variationGroupId: string;
    ingredientGroupIds: string[];
  }>(null);

  const canSaveEdit = useMemo(() => {
    if (!editDraft) return false;
    const nm = editDraft.name.trim();
    const p = Number(editDraft.price);
    const okPrice = Number.isFinite(p) && p >= 0;
    return nm.length >= 2 && !!editDraft.categoryId && okPrice;
  }, [editDraft]);

  function startEdit(d: any) {
    const vId = getDishVariationGroupId(d?.modifierGroupIds, variationIds);
    const ingIds = getDishIngredientGroupIds(d?.modifierGroupIds, vId);

    setEditDishId(d.id);
    setEditDraft({
      name: String(d?.name ?? ""),
      description: String(d?.description ?? ""),
      categoryId: String(d?.categoryId ?? ""),
      price: String(Number.isFinite(Number(d?.price)) ? Number(d.price) : 0),
      photoUrl: String(d?.photoUrl ?? ""),
      variationGroupId: vId,
      ingredientGroupIds: ingIds,
    });
  }

  // function onEditPhotoFile(file: File | null) {
  //   if (!file) return;
  //   const reader = new FileReader();
  //   reader.onload = () =>
  //     setEditDraft((prev) => (prev ? { ...prev, photoUrl: typeof reader.result === "string" ? reader.result : "" } : prev));
  //   reader.readAsDataURL(file);
  // }

  async function onEditPhotoFile(file: File | null) {
    if (!file) return;
    const url = await uploadImage(file, "dishes");
    setEditDraft((prev) => (prev ? { ...prev, photoUrl: url } : prev));
  }

  function toggleEditIngredientGroup(id: string) {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const list = prev.ingredientGroupIds.includes(id)
        ? prev.ingredientGroupIds.filter((x) => x !== id)
        : [id, ...prev.ingredientGroupIds];
      return { ...prev, ingredientGroupIds: list };
    });
  }

  async function saveEdit() {
    if (!editDishId || !editDraft) return;
    const nm = editDraft.name.trim();
    const cat = editDraft.categoryId;
    if (nm.length < 2) return;
    if (!cat) return;

    const p = Math.max(0, Math.round(Number(editDraft.price || 0)));
    const modifierGroupIds = [
      ...(editDraft.variationGroupId ? [editDraft.variationGroupId] : []),
      ...editDraft.ingredientGroupIds,
    ].filter(Boolean);

    await updateDish(editDishId, {
      name: nm,
      description: editDraft.description.trim(),
      categoryId: cat,
      price: p,
      photoUrl: editDraft.photoUrl || "",
      modifierGroupIds,
    });
    setEditDishId(null);
    setEditDraft(null);
  }

  function dishPriceLabel(d: any) {
    const vId = getDishVariationGroupId(d?.modifierGroupIds, variationIds);
    const base = Math.max(0, Math.round(Number(d?.price ?? 0)));
    if (!vId) return `${money(base)} грн`;
    const vg = groupById.get(vId);
    const prices = Array.isArray(vg?.options)
      ? vg.options
          .map((o: any) => Number(o.priceDelta || 0))
          .filter((n: any) => Number.isFinite(n))
      : [];
    if (!prices.length) return base > 0 ? `${money(base)} грн` : "—";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = min === max ? `${money(min)} грн` : `від ${money(min)} грн`;
    if (base > 0) return `${money(base)} грн • варіації ${range}`;
    return `варіації ${range}`;
  }

  function dishGroupsLabel(d: any) {
    const vId = getDishVariationGroupId(d?.modifierGroupIds, variationIds);
    const ingIds = getDishIngredientGroupIds(d?.modifierGroupIds, vId);
    const parts: string[] = [];
    if (vId) {
      const t = groupTitleById.get(vId);
      if (t) parts.push(`Варіації: ${cleanVariationTitle(t)}`);
    }
    const ingTitles = ingIds
      .map((id) => groupTitleById.get(id))
      .filter(Boolean)
      .map((t) => String(t));
    if (ingTitles.length)
      parts.push(
        `Інгредієнти: ${ingTitles.slice(0, 2).join(", ")}${ingTitles.length > 2 ? ` +${ingTitles.length - 2}` : ""}`
      );
    return parts.join(" • ");
  }

  const stoppedCount = dishes.filter((d) => d.isStopped).length;
  const activeCount = dishes.length - stoppedCount;

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title="Страви закладу"
          subtitle="Тут — операційний список: пошук, редагування, STOP та видалення. Створення нових страв — у вкладці “Страви + Варіації”."
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/admin/c/${cityId}/venues/${venueId}/menu/dishes`}>
                <Button type="button">+ Додати страву</Button>
              </Link>
            </div>
          }
        />

        <div className="ui-kpis ui-kpis3">
          <div className="ui-kpi">
            <div className="ui-kpiLabel">Всього</div>
            <div className="ui-kpiValue">{dishes.length}</div>
          </div>
          <div className="ui-kpi">
            <div className="ui-kpiLabel">Активні</div>
            <div className="ui-kpiValue">{activeCount}</div>
          </div>
          <div className="ui-kpi">
            <div className="ui-kpiLabel">STOP</div>
            <div className="ui-kpiValue">{stoppedCount}</div>
          </div>
        </div>

        <div className="ui-divider" style={{ margin: "14px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, alignItems: "end" }}>
          <div className="ui-field">
            <div className="ui-label">Пошук</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Напр. маргарита" />
          </div>
          <div className="ui-field">
            <div className="ui-label">Категорія</div>
            <Select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}>
              <option value="">— всі —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {!visibleDishes.length ? (
        <div className="ui-subtitle">Поки немає страв за цими фільтрами.</div>
      ) : (
        <div className="ui-grid">
          {visibleDishes.map((d) => {
            const isEditing = editDishId === d.id;
            const groupsLabel = dishGroupsLabel(d);

            return (
              <div key={d.id} className="ui-row">
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 12, alignItems: "center" }}>
                      <div className="ui-thumb">
                        {d.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.photoUrl} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span className="ui-subtitle">—</span>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 950, fontSize: 15 }}>{d.name}</div>
                          {d.isStopped ? <Badge variant="stop">STOP</Badge> : <Badge variant="ok">OK</Badge>}
                        </div>

                        <div className="ui-subtitle" style={{ marginTop: 4 }}>
                          {catMap.get(d.categoryId) ?? "—"} • <b>{dishPriceLabel(d)}</b>
                          {groupsLabel ? <span className="ui-muted"> • {groupsLabel}</span> : null}
                        </div>

                        {d.description ? (
                          <div
                            className="ui-subtitle"
                            style={{ marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {d.description}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="ui-actions">
                      <SecondaryButton
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditDishId(null);
                            setEditDraft(null);
                          } else {
                            startEdit(d);
                          }
                        }}
                      >
                        {isEditing ? "Закрити" : "Редагувати"}
                      </SecondaryButton>
                      <SecondaryButton type="button" onClick={() => setDishStopped(d.id, !d.isStopped)}>
                        {d.isStopped ? "Повернути" : "STOP"}
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        onClick={() => removeDish(d.id)}
                        style={{ borderColor: "rgba(239,68,68,0.35)" }}
                      >
                        Видалити
                      </SecondaryButton>
                    </div>
                  </div>

                  {isEditing && editDraft ? (
                    <div className="ui-row" style={{ padding: 14, background: "rgba(15,23,42,0.02)" }}>
                      <div style={{ fontWeight: 950, marginBottom: 10 }}>Редагування страви</div>

                      <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="ui-field">
                          <div className="ui-label">Назва</div>
                          <Input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((p) => (p ? { ...p, name: e.target.value } : p))}
                          />
                        </div>

                        <div className="ui-field">
                          <div className="ui-label">Категорія</div>
                          <Select
                            value={editDraft.categoryId}
                            onChange={(e) => setEditDraft((p) => (p ? { ...p, categoryId: e.target.value } : p))}
                          >
                            <option value="">— оберіть —</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                        <div className="ui-field">
                          <div className="ui-label">Ціна (грн)</div>
                          <Input
                            type="number"
                            min={0}
                            value={editDraft.price}
                            onChange={(e) => setEditDraft((p) => (p ? { ...p, price: e.target.value } : p))}
                          />
                          <div className="ui-subtitle" style={{ marginTop: 6 }}>
                            Базова ціна для основної страви. Якщо є варіації — у варіації вказується <b>повна ціна</b>.
                          </div>
                        </div>

                        <div className="ui-field">
                          <div className="ui-label">Фото1 (URL)</div>
                          <Input
                            value={editDraft.photoUrl}
                            onChange={(e) => setEditDraft((p) => (p ? { ...p, photoUrl: e.target.value } : p))}
                          />
                        </div>
                      </div>

                      <div className="ui-field" style={{ marginTop: 12 }}>
                        <div className="ui-label">Фото2 (файл)</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onEditPhotoFile(e.target.files?.[0] ?? null)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px dashed var(--border)",
                            background: "rgba(15,23,42,0.03)",
                            color: "var(--muted)",
                          }}
                        />
                      </div>

                      <div className="ui-field" style={{ marginTop: 12 }}>
                        <div className="ui-label">Опис</div>
                        <Textarea
                          value={editDraft.description}
                          onChange={(e) => setEditDraft((p) => (p ? { ...p, description: e.target.value } : p))}
                          rows={3}
                        />
                      </div>

                      <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                        <div className="ui-field">
                          <div className="ui-label">Варіації страви (опційно)</div>
                          {variationGroups.length === 0 ? (
                            <div className="ui-subtitle">Поки немає груп варіацій (створіть у вкладці “Страви + Варіації”).</div>
                          ) : (
                            <Select
                              value={editDraft.variationGroupId}
                              onChange={(e) => setEditDraft((p) => (p ? { ...p, variationGroupId: e.target.value } : p))}
                            >
                              <option value="">— без варіацій —</option>
                              {variationGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {cleanVariationTitle(g.title)}
                                </option>
                              ))}
                            </Select>
                          )}
                        </div>

                        <div className="ui-field">
                          <div className="ui-label">Інгредієнти (групи)</div>
                          {ingredientGroups.length === 0 ? (
                            <div className="ui-subtitle">Поки немає груп інгредієнтів (створіть у вкладці “Інгредієнти”).</div>
                          ) : (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {ingredientGroups.map((g) => {
                                const active = editDraft.ingredientGroupIds.includes(g.id);
                                return (
                                  <div
                                    key={g.id}
                                    onClick={() => toggleEditIngredientGroup(g.id)}
                                    role="button"
                                    tabIndex={0}
                                    className={active ? "ui-chip ui-chip--active" : "ui-chip"}
                                  >
                                    {g.title}
                                    {active ? " ✓" : ""}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ui-actions" style={{ marginTop: 12 }}>
                        <SecondaryButton
                          type="button"
                          onClick={() => {
                            setEditDishId(null);
                            setEditDraft(null);
                          }}
                        >
                          Скасувати
                        </SecondaryButton>
                        <Button type="button" onClick={saveEdit} disabled={!canSaveEdit}>
                          Зберегти
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
