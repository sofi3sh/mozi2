"use client";

import React, { useMemo, useState } from "react";
import { useMenu } from "@/store/menu";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton, Textarea, Select } from "@/components/ui/Input";

function money(n: number) {
  if (Number.isNaN(n)) return "0";
  return new Intl.NumberFormat("uk-UA").format(n);
}

function isVariationGroupTitle(title: string) {
  return String(title || "").startsWith("VAR::");
}

function cleanVariationTitle(title: string) {
  return String(title || "").replace(/^VAR::\s*/i, "");
}

export default function MenuDishesPage({ cityId, venueId }: { cityId: string; venueId: string }) {
  const {
    getCategories,
    getGroups,
    addDish,
    addGroup,
    updateGroup,
    removeGroup,
    addOption,
    removeOption,
    setOptionStopped,
  } = useMenu();

  const categories = getCategories(cityId, venueId);
  const allGroups = getGroups(cityId, venueId);

  const variationGroups = useMemo(() => allGroups.filter((g) => isVariationGroupTitle(g.title)), [allGroups]);
  const ingredientGroups = useMemo(() => allGroups.filter((g) => !isVariationGroupTitle(g.title)), [allGroups]);

  // Add dish form
  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState<string>("199");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  // Attachments
  const [variationGroupId, setVariationGroupId] = useState<string>("");
  const [ingredientGroupIds, setIngredientGroupIds] = useState<string[]>([]);

  const [newVarTitle, setNewVarTitle] = useState("");
  const canCreateInlineVarGroup = useMemo(() => newVarTitle.trim().length >= 2, [newVarTitle]);

  const currentVariationGroup = useMemo(
    () => variationGroups.find((g) => g.id === variationGroupId) || null,
    [variationGroups, variationGroupId]
  );

  const canAdd = useMemo(() => {
    const p = Number(price);
    const okPrice = Number.isFinite(p) && p >= 0;
    return name.trim().length >= 2 && categoryId && okPrice;
  }, [name, categoryId, price]);

  function onPhotoFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  function toggleIngredientGroup(id: string) {
    setIngredientGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }

  async function createInlineVariationGroup() {
    if (!canCreateInlineVarGroup) return;
    const t = newVarTitle.trim();
    const created = await addGroup({
      cityId,
      venueId,
      title: `VAR:: ${t}`,
      required: true,
      minSelect: 1,
      maxSelect: 1,
    });
    if (created) {
      setVariationGroupId(created.id);
      setNewVarTitle("");
    }
  }

  async function removeCurrentVariationGroup(id: string) {
    await removeGroup(id);
    if (variationGroupId === id) {
      setVariationGroupId("");
    }
  }

  function add() {
    if (!canAdd) return;
    const p = Math.max(0, Math.round(Number(price || 0)));

    const modifierGroupIds = [
      ...(variationGroupId ? [variationGroupId] : []),
      ...ingredientGroupIds,
    ].filter(Boolean);

    addDish({
      cityId,
      venueId,
      categoryId,
      name: name.trim(),
      nameRu: nameRu.trim(),
      description: description.trim(),
      descriptionRu: descriptionRu.trim(),
      price: p,
      photoUrl: photoUrl || "",
      isStopped: false,
      modifierGroupIds,
    });

    setName("");
    setNameRu("");
    setDescription("");
    setDescriptionRu("");
    setPrice("199");
    setPhotoUrl("");
    setVariationGroupId("");
    setIngredientGroupIds([]);
  }

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title="Страви + Варіації1"
          subtitle={
            categories.length === 0 ? (
              <>Спочатку створіть хоча б 1 категорію у вкладці “Категорії”.</>
            ) : (
              <>
                Створіть страву та підʼєднайте до неї <b>інгредієнти</b> і/або <b>групу варіацій</b>. Список і керування STOP/пошуком — у вкладці “Страви закладу”.
              </>
            )
          }
        />

        {categories.length === 0 ? null : (
          <div className="ui-grid">
            <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Назва</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Маргарита" />
              </div>
              <div className="ui-field">
                <div className="ui-label">Назва (RU)</div>
                <Input value={nameRu} onChange={(e) => setNameRu(e.target.value)} placeholder="Напр. Маргарита" />
              </div>

              <div className="ui-field">
                <div className="ui-label">Категорія</div>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">— оберіть —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="ui-field">
              <div className="ui-label">Опис</div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Коротко про страву..." />
            </div>
            <div className="ui-field">
              <div className="ui-label">Опис (RU)</div>
              <Textarea value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)} rows={3} placeholder="Коротко про блюдо..." />
            </div>

            <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Базова ціна (грн)</div>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={0} />
                <div className="ui-subtitle" style={{ marginTop: 6 }}>
                  Якщо є варіації — у варіації вказується <b>повна ціна</b>. Базова ціна використовується для “основної” страви.
                </div>
              </div>

              <div className="ui-field">
                <div className="ui-label">Фото (URL)</div>
                <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="ui-field">
              <div className="ui-label">Фото (файл)</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoFile(e.target.files?.[0] ?? null)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px dashed var(--border)",
                  background: "rgba(15,23,42,0.03)",
                  color: "var(--muted)",
                }}
              />
            </div>

            <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
              <div className="ui-field">
                <div className="ui-label">Варіації страви (опційно) Виберіть з списку або створіть нову</div>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr auto", gap: 8, alignItems: "center" }}>
                  <Select value={variationGroupId} onChange={(e) => setVariationGroupId(e.target.value)}>
                    <option value="">— без варіацій —</option>
                    {variationGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {cleanVariationTitle(g.title)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={newVarTitle}
                    onChange={(e) => setNewVarTitle(e.target.value)}
                    placeholder="Нова група (напр. Розмір)"
                  />
                  <SecondaryButton type="button" onClick={createInlineVariationGroup} disabled={!canCreateInlineVarGroup}>
                    Створити групу
                  </SecondaryButton>
                </div>
                {variationGroups.length === 0 && (
                  <div className="ui-subtitle" style={{ marginTop: 6 }}>
                    Поки немає груп варіацій (створіть у вкладці “Універсальні варіації” або прямо тут).
                  </div>
                )}
                <div className="ui-subtitle" style={{ marginTop: 8 }}>
                  Приклад варіації: <b>30см/410г — 193 грн</b> (ціна у варіації — <b>повна</b>).
                </div>
                {currentVariationGroup && (
                  <div style={{ marginTop: 12 }}>
                    <VariationGroupCard
                      group={currentVariationGroup}
                      onUpdate={updateGroup}
                      onRemove={removeCurrentVariationGroup}
                      onAddOption={addOption}
                      onRemoveOption={removeOption}
                      onToggleOptionStopped={setOptionStopped}
                    />
                  </div>
                )}
              </div>

              <div className="ui-field">
                <div className="ui-label">Інгредієнти (групи)</div>
                {ingredientGroups.length === 0 ? (
                  <div className="ui-subtitle">Поки немає груп інгредієнтів (створіть у вкладці “Інгредієнти”).</div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {ingredientGroups.map((g) => {
                      const active = ingredientGroupIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleIngredientGroup(g.id)}
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

            <div className="ui-preview">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="ui-subtitle" style={{ padding: 14, textAlign: "center" }}>
                  Превʼю фото
                </div>
              )}
            </div>

            <div className="ui-actions">
              <Button type="button" onClick={add} disabled={!canAdd}>
                Додати страву
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function VariationGroupsManager({
  cityId,
  venueId,
  variationGroups,
}: {
  cityId: string;
  venueId: string;
  variationGroups: any[];
}) {
  const { addGroup, updateGroup, removeGroup, addOption, removeOption, setOptionStopped } = useMenu();

  const [title, setTitle] = useState("");
  const canAddGroup = useMemo(() => title.trim().length >= 2, [title]);

  async function createGroup() {
    if (!canAddGroup) return;
    const t = title.trim();
    await addGroup({
      cityId,
      venueId,
      title: `VAR:: ${t}`,
      required: true,
      minSelect: 1,
      maxSelect: 1,
    });
    setTitle("");
  }

  return (
    <Card>
      <CardHeader
        title="Варіації страв"
        subtitle={
          <>
            Створюйте групи варіацій (наприклад: <b>Розмір/вага</b>). У варіації вказується <b>повна ціна</b>.
          </>
        }
      />

      <div className="ui-grid">
        <div className="ui-grid" style={{ gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
          <div className="ui-field">
            <div className="ui-label">Назва групи варіацій</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Розмір" />
          </div>
          <Button type="button" onClick={createGroup} disabled={!canAddGroup}>
            Додати групу
          </Button>
        </div>

        {!variationGroups.length ? (
          <div className="ui-subtitle">Поки немає груп варіацій.</div>
        ) : (
          <div className="ui-grid">
            {variationGroups.map((g) => (
              <VariationGroupCard
                key={g.id}
                group={g}
                onUpdate={updateGroup}
                onRemove={removeGroup}
                onAddOption={addOption}
                onRemoveOption={removeOption}
                onToggleOptionStopped={setOptionStopped}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function VariationGroupCard({
  group,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
  onToggleOptionStopped,
}: {
  group: any;
  onUpdate: (id: string, patch: any) => void;
  onRemove: (id: string) => void;
  onAddOption: (groupId: string, option: any) => void;
  onRemoveOption: (groupId: string, optionId: string) => void;
  onToggleOptionStopped: (groupId: string, optionId: string, isStopped: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(cleanVariationTitle(group.title));

  const [optName, setOptName] = useState("");
  const [optGrams, setOptGrams] = useState("");
  const [optPrice, setOptPrice] = useState("0");

  function saveGroup() {
    const t = title.trim();
    if (t.length < 2) return;
    onUpdate(group.id, {
      title: `VAR:: ${t}`,
      required: true,
      minSelect: 1,
      maxSelect: 1,
    });
    setEditing(false);
  }

  function addOpt() {
    const nm = optName.trim();
    if (!nm) return;
    const grams = optGrams.trim() ? Math.max(0, Math.round(Number(optGrams))) : undefined;
    const priceDelta = Math.max(0, Math.round(Number(optPrice || 0)));

    onAddOption(group.id, {
      name: nm,
      grams,
      priceDelta, // FULL price for variation
      isStopped: false,
    });

    setOptName("");
    setOptGrams("");
    setOptPrice("0");
  }

  return (
    <div className="ui-row">
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <div className="ui-label">Група варіацій</div>
            {editing ? <Input value={title} onChange={(e) => setTitle(e.target.value)} /> : <div style={{ fontWeight: 950, fontSize: 15 }}>{cleanVariationTitle(group.title)}</div>}
            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              <Badge variant="ok">Обовʼязково</Badge>{" "}
              <span className="ui-muted">• min 1 / max 1 • варіацій: {group.options?.length ?? 0}</span>
            </div>
          </div>

          <div className="ui-actions">
            {editing ? (
              <>
                <SecondaryButton type="button" onClick={() => setEditing(false)}>
                  Скасувати
                </SecondaryButton>
                <Button type="button" onClick={saveGroup} disabled={title.trim().length < 2}>
                  Зберегти
                </Button>
              </>
            ) : (
              <>
                <SecondaryButton type="button" onClick={() => setEditing(true)}>
                  Редагувати
                </SecondaryButton>
                <SecondaryButton type="button" onClick={() => onRemove(group.id)} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
                  Видалити
                </SecondaryButton>
              </>
            )}
          </div>
        </div>

        <div className="ui-divider" />

        <div className="ui-grid">
          <div style={{ fontWeight: 950 }}>Варіації</div>

          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 120px 160px auto", gap: 12, alignItems: "end" }}>
            <div className="ui-field">
              <div className="ui-label">Назва</div>
              <Input value={optName} onChange={(e) => setOptName(e.target.value)} placeholder="Напр. 30 см" />
            </div>
            <div className="ui-field">
              <div className="ui-label">Вага (г)</div>
              <Input type="number" value={optGrams} onChange={(e) => setOptGrams(e.target.value)} min={0} placeholder="—" />
            </div>
            <div className="ui-field">
              <div className="ui-label">Ціна (грн)</div>
              <Input type="number" value={optPrice} onChange={(e) => setOptPrice(e.target.value)} min={0} />
            </div>
            <Button type="button" onClick={addOpt}>
              Додати
            </Button>
          </div>

          {!group.options?.length ? (
            <div className="ui-subtitle">Поки немає варіацій.</div>
          ) : (
            <div className="ui-grid">
              {group.options.map((o: any) => (
                <div key={o.id} className="ui-row" style={{ padding: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 950 }}>{o.name}</div>
                        {o.isStopped ? <Badge variant="stop">STOP</Badge> : <Badge variant="ok">OK</Badge>}
                      </div>
                      <div className="ui-subtitle">
                        {o.grams != null ? <span>{money(Number(o.grams))} г</span> : <span className="ui-muted">—</span>}
                        <span className="ui-muted"> • </span>
                        <span>{money(Number(o.priceDelta))} грн</span>
                      </div>
                    </div>

                    <div className="ui-actions">
                      <SecondaryButton type="button" onClick={() => onToggleOptionStopped(group.id, o.id, !o.isStopped)}>
                        {o.isStopped ? "Повернути" : "STOP"}
                      </SecondaryButton>
                      <SecondaryButton type="button" onClick={() => onRemoveOption(group.id, o.id)} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
                        Видалити
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
