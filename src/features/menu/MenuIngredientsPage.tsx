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

function isVariationGroupTitle(title: string) {
  return String(title || "").startsWith("VAR::");
}

function cleanVariationTitle(title: string) {
  return String(title || "").replace(/^VAR::\s*/i, "");
}

export default function MenuIngredientsPage({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getGroups, addGroup, updateGroup, removeGroup, addOption, removeOption, setOptionStopped } = useMenu();
  const allGroups = getGroups(cityId, venueId);
  const groups = useMemo(() => allGroups.filter((g) => !isVariationGroupTitle(g.title)), [allGroups]);

  const [title, setTitle] = useState("");
  const [maxSelect, setMaxSelect] = useState("3");

  const canAddGroup = useMemo(() => title.trim().length >= 2, [title]);

  async function createGroup() {
    if (!canAddGroup) return;
    await addGroup({
      cityId,
      venueId,
      title: title.trim(),
      required: false,
      minSelect: 0,
      maxSelect: Math.max(0, Number(maxSelect || 0)),
    });
    setTitle("");
    setMaxSelect("3");
  }

  return (
    <div className="ui-twoCol">
      <Card>
        <CardHeader
          title="Інгредієнти"
          subtitle={
            <>
              Створюйте групи інгредієнтів (наприклад: <b>Сири</b>, <b>Соуси</b>, <b>Добавки</b>) і додавайте опції з вагою та ціною.
            </>
          }
        />

        <div className="ui-grid">
          <div className="ui-field">
            <div className="ui-label">Назва групи</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Сири" />
          </div>

          <div className="ui-field">
            <div className="ui-label">Макс. вибір у групі</div>
            <Input type="number" value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} min={0} />
          </div>

          <div className="ui-actions">
            <Button type="button" onClick={createGroup} disabled={!canAddGroup}>
              Додати групу
            </Button>
          </div>

          <div className="ui-subtitle">
            Порада: для інгредієнтів зазвичай <b>min=0</b>, а max — 1–5 (залежить від страви).
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Список груп" subtitle="Редагуйте групи та їхні інгредієнти. STOP можна вмикати прямо тут." />

        {!groups.length ? (
          <div className="ui-subtitle">Поки немає груп інгредієнтів.</div>
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
                onToggleOptionStopped={setOptionStopped}
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
  const [title, setTitle] = useState(group.title);
  const [maxSelect, setMaxSelect] = useState(String(group.maxSelect ?? 3));

  const [optName, setOptName] = useState("");
  const [optGrams, setOptGrams] = useState("");
  const [optPrice, setOptPrice] = useState("0");
  const [optMaxQty, setOptMaxQty] = useState("1");

  function saveGroup() {
    onUpdate(group.id, {
      title: title.trim(),
      required: false,
      minSelect: 0,
      maxSelect: Math.max(0, Number(maxSelect || 0)),
    });
    setEditing(false);
  }

  function addOpt() {
    const nm = optName.trim();
    if (nm.length < 1) return;

    const grams = optGrams.trim() ? Math.max(0, Math.round(Number(optGrams))) : undefined;
    const maxQty = optMaxQty.trim() ? Math.max(1, Math.round(Number(optMaxQty))) : undefined;
    const priceDelta = Math.max(0, Math.round(Number(optPrice || 0)));

    onAddOption(group.id, {
      name: nm,
      grams,
      maxQty,
      priceDelta,
      isStopped: false,
    });

    setOptName("");
    setOptGrams("");
    setOptPrice("0");
    setOptMaxQty("1");
  }

  return (
    <div className="ui-row">
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <div className="ui-label">Група</div>
            {editing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            ) : (
              <div style={{ fontWeight: 950, fontSize: 15 }}>{cleanVariationTitle(group.title)}</div>
            )}

            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              <Badge>Інгредієнти</Badge>{" "}
              <span className="ui-muted">• max {group.maxSelect} • опцій: {group.options?.length ?? 0}</span>
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
          <div className="ui-grid" style={{ gridTemplateColumns: "200px 1fr", gap: 12, alignItems: "end" }}>
            <div className="ui-field">
              <div className="ui-label">Макс. вибір у групі</div>
              <Input type="number" value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} min={0} />
            </div>
            <div className="ui-subtitle">Min завжди 0, обовʼязковість вимкнена (для інгредієнтів).</div>
          </div>
        ) : null}

        <div className="ui-divider" />

        <div className="ui-grid">
          <div style={{ fontWeight: 950 }}>Інгредієнти</div>

          <div className="ui-grid" style={{ gridTemplateColumns: "1fr 110px 140px 110px auto", gap: 12, alignItems: "end" }}>
            <div className="ui-field">
              <div className="ui-label">Назва</div>
              <Input value={optName} onChange={(e) => setOptName(e.target.value)} placeholder="Напр. Пармезан" />
            </div>
            <div className="ui-field">
              <div className="ui-label">Вага (г)</div>
              <Input type="number" value={optGrams} onChange={(e) => setOptGrams(e.target.value)} min={0} placeholder="—" />
            </div>
            <div className="ui-field">
              <div className="ui-label">+ Ціна (грн)</div>
              <Input type="number" value={optPrice} onChange={(e) => setOptPrice(e.target.value)} min={0} />
            </div>
            <div className="ui-field">
              <div className="ui-label">max qty</div>
              <Input type="number" value={optMaxQty} onChange={(e) => setOptMaxQty(e.target.value)} min={1} />
            </div>
            <Button type="button" onClick={addOpt}>
              Додати
            </Button>
          </div>

          {!group.options?.length ? (
            <div className="ui-subtitle">Поки немає інгредієнтів.</div>
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
                        {o.grams != null ? <span>{nf(o.grams)} г</span> : <span className="ui-muted">—</span>}
                        <span className="ui-muted"> • </span>
                        <span>+ {nf(o.priceDelta)} грн</span>
                        {o.maxQty != null ? <span className="ui-muted"> • max {nf(o.maxQty)}</span> : null}
                      </div>
                    </div>

                    <div className="ui-actions">
                      <SecondaryButton type="button" onClick={() => onToggleOptionStopped(group.id, o.id, !o.isStopped)}>
                        {o.isStopped ? "Повернути" : "STOP"}
                      </SecondaryButton>
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
        </div>
      </div>
    </div>
  );
}
