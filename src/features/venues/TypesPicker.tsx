"use client";

import React, { useMemo, useState } from "react";
import { Button, Input, SecondaryButton } from "@/components/ui/Input";

type Item = { id: string; name: string };

export default function TypesPicker({
  title,
  items,
  selectedIds,
  onChange,
  onAdd,
}: {
  title: string;
  items: Item[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onAdd: (input: { name: string; nameRu?: string }) => Item | null;
}) {
  const [newName, setNewName] = useState("");
  const [newNameRu, setNewNameRu] = useState("");
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: string) {
    if (selectedSet.has(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([id, ...selectedIds]);
  }

  function add() {
    const created = onAdd({ name: newName, nameRu: newNameRu });
    if (!created) return;
    setNewName("");
    setNewNameRu("");
    onChange([created.id, ...selectedIds]);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 900 }}>{title}</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map((it) => {
          const active = selectedSet.has(it.id);
          return (
            <div
              key={it.id}
              onClick={() => toggle(it.id)}
              role="button"
              tabIndex={0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 999,
                border: active ? "1px solid rgba(59,130,246,0.45)" : "1px solid var(--border)",
                background: active ? "rgba(59,130,246,0.18)" : "rgba(18,33,58,0.25)",
                cursor: "pointer",
                userSelect: "none",
                fontWeight: 700,
              }}
            >
              {it.name}
              {active ? " ✓" : ""}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 10, alignItems: "end" }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Додати новий (UA)</div>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Введіть назву..." />
        </div>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Додати новий (RU)</div>
          <Input value={newNameRu} onChange={(e) => setNewNameRu(e.target.value)} placeholder="Введіть назву..." />
        </div>

        <Button type="button" onClick={add} style={{ height: 42 }}>
          Додати
        </Button>
        <SecondaryButton
          type="button"
          onClick={() => {
            setNewName("");
            setNewNameRu("");
          }}
          style={{ height: 42 }}
        >
          Очистити
        </SecondaryButton>
      </div>

      <div style={{ color: "var(--muted)", fontSize: 12 }}>Вибрано: {selectedIds.length}</div>
    </div>
  );
}
