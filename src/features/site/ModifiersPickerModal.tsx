"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Dish, ModifierGroup } from "@/store/menu";
import { Button, SecondaryButton } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatMoneyUAH, type CartModifierSelection } from "@/store/cart";

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

function clampArray<T>(arr: T[], max: number) {
  return arr.length <= max ? arr : arr.slice(0, max);
}

export default function ModifiersPickerModal({
  open,
  dish,
  groups,
  qty,
  onClose,
  onConfirm,
  lang,
}: {
  open: boolean;
  dish: Dish | null;
  groups: ModifierGroup[];
  qty: number;
  lang: "ua" | "ru";
  onClose: () => void;
  onConfirm: (selections: CartModifierSelection[]) => void;
}) {
  // IMPORTANT: do not conditionally skip hooks (fixes: "Rendered more hooks than during the previous render")
  const isActive = open && !!dish;

  const visibleGroups = useMemo(() => {
    if (!dish) return [] as ModifierGroup[];
    const ids = new Set((dish.modifierGroupIds || []).map(String));
    return groups.filter((g) => ids.has(g.id));
  }, [dish, groups]);

  const [sel, setSel] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!open) return;
    // reset selections on open
    const initial: Record<string, string[]> = {};
    for (const g of visibleGroups) initial[g.id] = [];
    setSel(initial);
  }, [open, visibleGroups]);

  function toggle(group: ModifierGroup, optionId: string) {
    setSel((prev) => {
      const cur = prev[group.id] || [];
      const exists = cur.includes(optionId);
      let next = exists ? cur.filter((x) => x !== optionId) : [...cur, optionId];
      // enforce max
      if (group.maxSelect > 0) next = clampArray(next, group.maxSelect);
      return { ...prev, [group.id]: next };
    });
  }

  function validate(): string | null {
    for (const g of visibleGroups) {
      const picked = sel[g.id] || [];
      const min = Math.max(0, Number(g.minSelect || 0));
      if ((g.required || min > 0) && picked.length < min) {
        return lang === "ru"
          ? `Выберите минимум ${min} в группе «${g.title}»`
          : `Оберіть мінімум ${min} у групі «${g.title}»`;
      }
    }
    return null;
  }

  const delta = useMemo(() => {
    if (!isActive) return 0;
    const deltas: number[] = [];
    for (const g of visibleGroups) {
      const picked = sel[g.id] || [];
      for (const oid of picked) {
        const opt = (g.options || []).find((o) => o.id === oid);
        if (opt) deltas.push(Number(opt.priceDelta) || 0);
      }
    }
    return sum(deltas);
  }, [isActive, sel, visibleGroups]);

  const unit = Math.max(0, Math.round(Number(dish?.price || 0) + delta));

  if (!isActive || !dish) return null;

  function confirm() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const selections: CartModifierSelection[] = [];
    for (const g of visibleGroups) {
      const picked = (sel[g.id] || []).slice();
      if (!picked.length) continue;
      const titles: string[] = [];
      let priceDeltaSum = 0;
      for (const oid of picked) {
        const opt = (g.options || []).find((o) => o.id === oid);
        if (!opt) continue;
        titles.push(opt.name);
        priceDeltaSum += Number(opt.priceDelta) || 0;
      }
      selections.push({
        groupId: g.id,
        groupTitle: g.title,
        optionIds: picked,
        optionTitles: titles,
        priceDeltaSum: Math.round(priceDeltaSum),
      });
    }

    onConfirm(selections);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(17,24,39,0.45)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onMouseDown={(e) => {
        // click outside
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ width: "min(720px, 100%)" }}>
        <Card>
          <CardHeader
            title={lang === "ru" ? "Модификаторы" : "Модифікатори"}
            subtitle={
              <span>
                <b>{dish.name}</b> · {lang === "ru" ? "Кол-во" : "К-сть"}: {qty} · {formatMoneyUAH(unit)} / 1
              </span>
            }
            right={
              <SecondaryButton type="button" onClick={onClose}>
                {lang === "ru" ? "Закрыть" : "Закрити"}
              </SecondaryButton>
            }
          />

          <div style={{ padding: 14, display: "grid", gap: 12 }}>
            {visibleGroups.map((g) => {
              const picked = sel[g.id] || [];
              return (
                <div
                  key={g.id}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(31,41,55,0.10)",
                    background: "rgba(255,255,255,0.78)",
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 950 }}>{g.title}</div>
                    <div style={{ opacity: 0.72, fontWeight: 800, fontSize: 12 }}>
                      {(g.required || g.minSelect > 0) ? (lang === "ru" ? `минимум ${g.minSelect}` : `мінімум ${g.minSelect}`) : (lang === "ru" ? "необязательно" : "необовʼязково")}
                      {g.maxSelect > 0 ? (lang === "ru" ? ` · максимум ${g.maxSelect}` : ` · максимум ${g.maxSelect}`) : ""}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {(g.options || []).filter((o) => !o.isStopped).map((o) => {
                      const active = picked.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => toggle(g, o.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: active ? "1px solid rgba(230,162,74,0.70)" : "1px solid rgba(31,41,55,0.10)",
                            background: active ? "rgba(230,162,74,0.18)" : "rgba(255,255,255,0.70)",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontWeight: 850 }}>{o.name}</span>
                          <span style={{ fontWeight: 950, opacity: 0.92 }}>{o.priceDelta ? `${o.priceDelta > 0 ? "+" : ""}${formatMoneyUAH(o.priceDelta).replace(" ₴", "")}` + " ₴" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950 }}>
                {lang === "ru" ? "Итого за 1:" : "Разом за 1:"} {formatMoneyUAH(unit)}
              </div>
              <Button type="button" onClick={confirm}>
                {lang === "ru" ? "Добавить в корзину" : "Додати в кошик"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
