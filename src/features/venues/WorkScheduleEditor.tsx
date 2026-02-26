"use client";

import React from "react";
import type { ScheduleException, WorkDay, WorkSchedule } from "@/store/venues";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";

const labels: Record<WorkDay["day"], string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Нд",
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WorkScheduleEditor({
  value,
  onChange,
}: {
  value: WorkSchedule;
  onChange: (next: WorkSchedule) => void;
}) {
  function updateDay(idx: number, patch: Partial<WorkDay>) {
    onChange({ ...value, days: value.days.map((d, i) => (i === idx ? { ...d, ...patch } : d)) });
  }

  function addException() {
    const ex: ScheduleException = {
      date: todayISO(),
      isClosed: false,
      open: "09:00",
      close: "21:00",
      note: "",
    };
    onChange({ ...value, exceptions: [...(value.exceptions ?? []), ex] });
  }

  function updateException(idx: number, patch: Partial<ScheduleException>) {
    onChange({
      ...value,
      exceptions: (value.exceptions ?? []).map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    });
  }

  function removeException(idx: number) {
    onChange({ ...value, exceptions: (value.exceptions ?? []).filter((_, i) => i !== idx) });
  }

  const exceptions = value.exceptions ?? [];

  return (
    <div className="ui-grid">
      {/* Week schedule */}
      <div style={{ display: "grid", gap: 8 }}>
        {value.days.map((d, idx) => (
          <div
            key={d.day}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 130px 1fr 1fr",
              gap: 10,
              alignItems: "center",
              border: "1px solid var(--border)",
              background: "rgba(18,33,58,0.35)",
              borderRadius: 12,
              padding: 10,
            }}
          >
            <div style={{ fontWeight: 900 }}>{labels[d.day]}</div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontWeight: 900 }}>
              <input
                type="checkbox"
                checked={d.isClosed}
                onChange={(e) => updateDay(idx, { isClosed: e.target.checked })}
              />
              Закрито
            </label>

            <div className="ui-field">
              <div className="ui-label">Відкриття</div>
              <Input
                type="time"
                value={d.open}
                disabled={d.isClosed}
                onChange={(e) => updateDay(idx, { open: e.target.value })}
              />
            </div>

            <div className="ui-field">
              <div className="ui-label">Закриття</div>
              <Input
                type="time"
                value={d.close}
                disabled={d.isClosed}
                onChange={(e) => updateDay(idx, { close: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Exceptions */}
      <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950 }}>Винятки</div>
            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              Дні, коли графік відрізняється (свята, скорочені години, перенос). Якщо «Закрито» — час не потрібен.
            </div>
          </div>

          <Button type="button" onClick={addException}>
            + Додати виняток
          </Button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {!exceptions.length ? (
            <div className="ui-subtitle" style={{ fontWeight: 800 }}>
              Винятків поки немає.
            </div>
          ) : null}

          {exceptions.map((e, idx) => (
            <div
              key={`${e.date}-${idx}`}
              style={{
                border: "1px solid var(--border)",
                background: "var(--panel)",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "200px 160px 1fr", gap: 12, alignItems: "end" }}>
                <div className="ui-field">
                  <div className="ui-label">Дата</div>
                  <Input type="date" value={e.date} onChange={(ev) => updateException(idx, { date: ev.target.value })} />
                </div>

                <label className="ui-checkRow" style={{ justifyContent: "flex-start" }}>
                  <input
                    type="checkbox"
                    checked={e.isClosed}
                    onChange={(ev) => updateException(idx, { isClosed: ev.target.checked })}
                  />
                  Закрито
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <SecondaryButton type="button" onClick={() => removeException(idx)}>
                    Видалити
                  </SecondaryButton>
                </div>
              </div>

              {!e.isClosed ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="ui-field">
                    <div className="ui-label">Відкриття</div>
                    <Input type="time" value={e.open} onChange={(ev) => updateException(idx, { open: ev.target.value })} />
                  </div>
                  <div className="ui-field">
                    <div className="ui-label">Закриття</div>
                    <Input type="time" value={e.close} onChange={(ev) => updateException(idx, { close: ev.target.value })} />
                  </div>
                </div>
              ) : null}

              <div className="ui-field">
                <div className="ui-label">Коментар (опційно)</div>
                <Textarea
                  rows={2}
                  value={e.note ?? ""}
                  onChange={(ev) => updateException(idx, { note: ev.target.value })}
                  placeholder="Напр. працюємо до 18:00"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
