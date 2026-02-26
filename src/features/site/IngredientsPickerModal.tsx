"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Dish, ModifierGroup, ModifierOption } from "@/store/menu";
import type { CartModifierSelection } from "@/store/cart";
import { Button } from "@/components/ui/Input";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function groupLimit(g: ModifierGroup) {
  const max = Number(g.maxSelect ?? 0);
  return max > 0 ? max : Infinity;
}

function optionLimit(o: ModifierOption) {
  const max = Number(o.maxQty ?? 0);
  return max > 0 ? max : Infinity;
}

function cleanGroupTitle(title: string) {
  return String(title || "").replace(/^\s*ING::\s*/i, "").trim();
}

function sumRow(row: Record<string, number>) {
  return sum(Object.values(row).map((v) => Number(v || 0) || 0));
}

export default function IngredientsPickerModal({
  open,
  dish,
  groups,
  basePrice,
  baseSelections,
  initialQty,
  onClose,
  onConfirm,
}: {
  open: boolean;
  dish: Dish | null;
  groups: ModifierGroup[];
  basePrice: number;
  baseSelections: CartModifierSelection[];
  initialQty: number;
  onClose: () => void;
  onConfirm: (qty: number, selections: CartModifierSelection[]) => void;
}) {
  const isActive = open && !!dish;

  // counts[groupId][optionId] = qty
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, Record<string, number>> = {};
    for (const g of groups || []) {
      const row: Record<string, number> = {};
      for (const o of (g.options || []).filter((x) => !x.isStopped)) row[o.id] = 0;
      next[g.id] = row;
    }
    setCounts(next);
    setQty(Math.max(1, Math.round(Number(initialQty) || 1)));
  }, [open, groups, initialQty]);

  const unitDelta = useMemo(() => {
    if (!isActive) return 0;
    const deltas: number[] = [];
    for (const g of groups || []) {
      const row = counts[g.id] || {};
      for (const o of (g.options || []).filter((x) => !x.isStopped)) {
        const c = Number(row[o.id] || 0) || 0;
        if (c <= 0) continue;
        deltas.push(c * (Number(o.priceDelta) || 0));
      }
    }
    return Math.max(0, Math.round(sum(deltas)));
  }, [isActive, counts, groups]);

  const unitTotal = Math.max(0, Math.round(Number(basePrice || 0) + unitDelta));
  const total = Math.max(0, unitTotal * qty);

  function groupPickedCount(g: ModifierGroup) {
    const row = counts[g.id] || {};
    return sumRow(row);
  }

  function setOptionQty(g: ModifierGroup, o: ModifierOption, nextQty: number) {
    setCounts((prev) => {
      const row = { ...(prev[g.id] || {}) };
      const maxO = optionLimit(o);
      const maxG = groupLimit(g);

      const current = Number(row[o.id] || 0) || 0;
      const desired = clamp(Math.round(nextQty), 0, maxO);

      // Enforce group maxSelect as sum of quantities.
      const picked = sumRow(row);
      const pickedWithoutThis = picked - current;
      const allowedForThis = Math.max(0, maxG - pickedWithoutThis);
      row[o.id] = clamp(desired, 0, allowedForThis);

      return { ...prev, [g.id]: row };
    });
  }

  function validate(): string | null {
    for (const g of groups || []) {
      const picked = groupPickedCount(g);
      const min = Math.max(0, Math.round(Number(g.minSelect || 0) || 0));
      if ((g.required || min > 0) && picked < min) {
        return `Оберіть мінімум ${min} у групі «${cleanGroupTitle(g.title)}»`;
      }
    }
    return null;
  }

  function confirm() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const selections: CartModifierSelection[] = [...(baseSelections || []).map((x) => ({ ...x }))];

    for (const g of groups || []) {
      const row = counts[g.id] || {};
      const optionIds: string[] = [];
      const optionTitles: string[] = [];
      let priceDeltaSum = 0;

      for (const o of (g.options || []).filter((x) => !x.isStopped)) {
        const c = Number(row[o.id] || 0) || 0;
        if (c <= 0) continue;
        for (let i = 0; i < c; i++) {
          optionIds.push(o.id);
          optionTitles.push(o.name);
        }
        priceDeltaSum += c * (Number(o.priceDelta) || 0);
      }

      if (!optionIds.length) continue;
      selections.push({
        groupId: g.id,
        groupTitle: cleanGroupTitle(g.title),
        optionIds,
        optionTitles,
        priceDeltaSum: Math.max(0, Math.round(priceDeltaSum)),
      });
    }

    onConfirm(qty, selections);
  }

  if (!isActive || !dish) return null;

  const photo = dish.photoUrl?.trim() ? dish.photoUrl : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="ingModalOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ingModalCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ingModalHeader">
          <div style={{ minWidth: 0 }}>
            <div className="ingModalTitle">{dish.name}</div>
            {dish.description ? <div className="ingModalDesc">{dish.description}</div> : null}

            <div className="ingModalPriceRow">
              <div className="ingModalPrice">{new Intl.NumberFormat("uk-UA").format(unitTotal)} ₴</div>
              <div className="ingModalPriceHint">за порцію</div>
            </div>
          </div>

          <div className="ingModalPhotoWrap">
            <button
              type="button"
              className="ingModalClose"
              onClick={onClose}
              aria-label="Закрити"
              title="Закрити"
            >
              ×
            </button>

            <div
              className="ingModalPhoto"
              style={{ backgroundImage: photo ? `url(${photo})` : undefined }}
              aria-label={dish.name}
            >
              {!photo ? <div className="ingModalPhotoFallback">{(dish.name || "M").slice(0, 1).toUpperCase()}</div> : null}
            </div>
          </div>
        </div>

        <div className="ingModalBody">
          <div className="ingModalSectionTitle">
            <span>Додайте інгредієнти</span>
            <span className="ingModalBadge">+</span>
          </div>

          <div className="ingModalGroups">
            {(groups || []).map((g) => {
              const title = cleanGroupTitle(g.title);
              const picked = groupPickedCount(g);
              const maxG = groupLimit(g);
              const min = Math.max(0, Math.round(Number(g.minSelect || 0) || 0));
              const req = g.required || min > 0;

              return (
                <div key={g.id} className="ingModalGroup">
                  <div className="ingModalGroupHead">
                    <div className="ingModalGroupTitle">{title}</div>
                    <div className="ingModalGroupMeta">
                      {req ? `мінімум ${min}` : "необовʼязково"}
                      {Number.isFinite(maxG) && maxG !== Infinity ? ` · максимум ${maxG}` : ""}
                      {picked ? ` · обрано ${picked}` : ""}
                    </div>
                  </div>

                  <div className="ingModalRows">
                    {(g.options || []).filter((o) => !o.isStopped).map((o) => {
                      const row = counts[g.id] || {};
                      const c = Number(row[o.id] || 0) || 0;
                      const canDec = c > 0;
                      const canInc = c < optionLimit(o) && groupPickedCount(g) < groupLimit(g);

                      return (
                        <div key={o.id} className="ingModalRow">
                          <div style={{ minWidth: 0 }}>
                            <div className="ingModalRowTop">
                              <span className="ingModalRowName">{o.name}</span>
                              <span className="ingModalRowMeta">
                                {o.grams ? `${o.grams} г` : ""}
                                {o.priceDelta ? ` · +${new Intl.NumberFormat("uk-UA").format(o.priceDelta)} ₴` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="ingModalCounter">
                            <button
                              type="button"
                              className="ingModalCounterBtn"
                              onClick={() => setOptionQty(g, o, c - 1)}
                              disabled={!canDec}
                              aria-label="Зменшити"
                            >
                              −
                            </button>
                            <div className="ingModalCounterVal">{c}</div>
                            <button
                              type="button"
                              className="ingModalCounterBtn ingModalCounterBtnPlus"
                              onClick={() => setOptionQty(g, o, c + 1)}
                              disabled={!canInc}
                              aria-label="Збільшити"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ingModalFooter">
            <div className="ingModalTotal">Разом: {new Intl.NumberFormat("uk-UA").format(total)} ₴</div>

            <div className="ingModalActions">
              <div className="ingModalQtyPill">
                <button
                  type="button"
                  className="ingModalQtyBtn"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  aria-label="Зменшити кількість"
                >
                  −
                </button>
                <div className="ingModalQtyVal">{qty}</div>
                <button
                  type="button"
                  className="ingModalQtyBtn ingModalQtyBtnPlus"
                  onClick={() => setQty((v) => v + 1)}
                  aria-label="Збільшити кількість"
                >
                  +
                </button>
              </div>

              <Button
                type="button"
                onClick={confirm}
                style={{
                  padding: "12px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(230,162,74,0.70)",
                  background: "#e6a24a",
                  boxShadow: "0 14px 34px rgba(230,162,74,0.25)",
                  color: "#fff",
                  fontWeight: 950,
                }}
              >
                Додати до замовлення
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
