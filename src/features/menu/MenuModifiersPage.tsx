"use client";

import React, { useMemo, useState } from "react";
import { useMenu } from "@/store/menu";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";

function nf(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("uk-UA").format(n);
}

export default function MenuModifiersPage({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getGroups, addGroup, updateGroup, removeGroup, addOption, removeOption } = useMenu();
  const groups = getGroups(cityId, venueId);

  const [title, setTitle] = useState("");
  const [required, setRequired] = useState(false);
  const [minSelect, setMinSelect] = useState("0");
  const [maxSelect, setMaxSelect] = useState("1");

  const canAddGroup = useMemo(() => title.trim().length >= 2, [title]);

  function createGroup() {
    if (!canAddGroup) return;
    addGroup({
      cityId,
      venueId,
      title: title.trim(),
      required,
      minSelect: Number(minSelect || 0),
      maxSelect: Number(maxSelect || 1),
    });
    setTitle("");
    setRequired(false);
    setMinSelect("0");
    setMaxSelect("1");
  }

  return (
    <div className="ui-twoCol">
      <Card>
        <CardHeader
          title="Модифікатори"
          subtitle={
            <>
              Створюйте групи модифікаторів (наприклад: <b>Соуси</b>, <b>Розмір</b>, <b>Добавки</b>) і додавайте опції.
            </>
          }
        />

        <div className="ui-grid">
          <div className="ui-field">
            <div className="ui-label">Назва групи</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Розмір" />
          </div>

          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Min</div>
              <Input type="number" value={minSelect} onChange={(e) => setMinSelect(e.target.value)} min={0} />
            </div>
            <div className="ui-field">
              <div className="ui-label">Max</div>
              <Input type="number" value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} min={0} />
            </div>
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--muted)", fontWeight: 900 }}>
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            Обовʼязково
          </label>

          <div className="ui-actions">
            <Button type="button" onClick={createGroup} disabled={!canAddGroup}>
              Додати групу
            </Button>
          </div>

          <div className="ui-subtitle">
            Стоп-лист для опцій — у вкладці <b>“Стоп-лист”</b>.
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Список груп" subtitle="Натисніть групу, щоб додавати опції." />

        {!groups.length ? (
          <div className="ui-subtitle">Поки немає груп.</div>
        ) : (
          <div className="ui-grid">
            {groups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                onUpdate={updateGroup}
                onRemove={removeGroup}
                onAddOption={addOption}
                onRemoveOption={removeOption}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function GroupCard({
  group,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
}: {
  group: any;
  onUpdate: (id: string, patch: any) => void;
  onRemove: (id: string) => void;
  onAddOption: (groupId: string, option: any) => void;
  onRemoveOption: (groupId: string, optionId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(group.title);
  const [required, setRequired] = useState(Boolean(group.required));
  const [minSelect, setMinSelect] = useState(String(group.minSelect ?? 0));
  const [maxSelect, setMaxSelect] = useState(String(group.maxSelect ?? 1));

  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState("0");

  function saveGroup() {
    onUpdate(group.id, {
      title: title.trim(),
      required,
      minSelect: Number(minSelect || 0),
      maxSelect: Number(maxSelect || 1),
    });
    setEditing(false);
  }

  function addOption() {
    if (optName.trim().length < 1) return;
    onAddOption(group.id, { name: optName.trim(), priceDelta: Number(optPrice || 0), isStopped: false });
    setOptName("");
    setOptPrice("0");
  }

  return (
    <div className="ui-row">
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <div className="ui-label">Група</div>
            {editing ? <Input value={title} onChange={(e) => setTitle(e.target.value)} /> : <div style={{ fontWeight: 950, fontSize: 15 }}>{group.title}</div>}
            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              {group.required ? <Badge variant="ok">Обовʼязково</Badge> : <Badge>Опційно</Badge>}{" "}
              <span className="ui-muted">• min {group.minSelect} / max {group.maxSelect} • опцій: {group.options?.length ?? 0}</span>
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
                <SecondaryButton
                  type="button"
                  onClick={() => onRemove(group.id)}
                  style={{ borderColor: "rgba(239,68,68,0.35)" }}
                >
                  Видалити
                </SecondaryButton>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="ui-grid" style={{ gridTemplateColumns: "140px 140px 220px", gap: 12, alignItems: "end" }}>
            <div className="ui-field">
              <div className="ui-label">Min</div>
              <Input type="number" value={minSelect} onChange={(e) => setMinSelect(e.target.value)} min={0} />
            </div>
            <div className="ui-field">
              <div className="ui-label">Max</div>
              <Input type="number" value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} min={0} />
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--muted)", fontWeight: 900 }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Обовʼязково
            </label>
          </div>
        ) : null}

        <div className="ui-divider" />

        <div className="ui-grid">
          <div style={{ fontWeight: 950 }}>Опції</div>

          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 160px auto", gap: 12, alignItems: "end" }}>
            <div className="ui-field">
              <div className="ui-label">Назва опції</div>
              <Input value={optName} onChange={(e) => setOptName(e.target.value)} placeholder="Напр. Великий" />
            </div>
            <div className="ui-field">
              <div className="ui-label">+ Ціна (грн)</div>
              <Input type="number" value={optPrice} onChange={(e) => setOptPrice(e.target.value)} />
            </div>
            <Button type="button" onClick={addOption}>
              Додати
            </Button>
          </div>

          {!group.options?.length ? (
            <div className="ui-subtitle">Поки немає опцій.</div>
          ) : (
            <div className="ui-grid">
              {group.options.map((o: any) => (
                <div key={o.id} className="ui-row" style={{ padding: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950 }}>{o.name}</div>
                      <div className="ui-subtitle">+ {nf(o.priceDelta)} грн</div>
                    </div>
                    <div className="ui-actions">
                      <SecondaryButton
                        type="button"
                        onClick={() => onRemoveOption(group.id, o.id)}
                        style={{ borderColor: "rgba(239,68,68,0.35)" }}
                      >
                        Видалити
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="ui-subtitle">
            Стоп-статус опцій керується у вкладці <b>“Стоп-лист”</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
