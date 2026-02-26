"use client";

import React, { useMemo, useState } from "react";
import { Input, Select, SecondaryButton, Textarea } from "@/components/ui/Input";
import { useSettings } from "@/store/settings";
import type { CitySettings, DeliverySchedule, GeoZone } from "@/store/settings";

function num(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ui-row" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>{title}</div>
          {subtitle ? (
            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="ui-divider" style={{ margin: "12px 0" }} />
      {children}
    </div>
  );
}

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

const dayLabels: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  0: "Нд",
};

function ensureWeek(schedule: DeliverySchedule) {
  const week = Array.isArray(schedule.week) ? schedule.week : [];
  const byDay = new Map<number, any>(week.map((w) => [w.day, w]));
  const days = [1, 2, 3, 4, 5, 6, 0];
  return days.map((day) => {
    const entry = byDay.get(day);
    return {
      day,
      enabled: Boolean(entry?.enabled ?? true),
      from: String(entry?.from ?? (day === 6 || day === 0 ? "10:00" : "09:00")),
      to: String(entry?.to ?? (day === 6 || day === 0 ? "20:00" : "21:00")),
    };
  });
}

function circleFromShape(shape: any) {
  if (shape && shape.type === "circle" && Array.isArray(shape.center)) {
    const lng = Number(shape.center[0] ?? 0);
    const lat = Number(shape.center[1] ?? 0);
    const radius = Number(shape.radiusMeters ?? 0);
    return { lat: Number.isFinite(lat) ? lat : 0, lng: Number.isFinite(lng) ? lng : 0, radius: Number.isFinite(radius) ? radius : 0 };
  }
  return { lat: 0, lng: 0, radius: 0 };
}

function shapeCircle(lat: number, lng: number, radius: number) {
  return { type: "circle", center: [lng, lat], radiusMeters: radius };
}

export default function CitySettingsForm({ cityId }: { cityId: string }) {
  const { getCity, updateCity } = useSettings();
  const city = getCity(cityId);

  // локальні чернетки для "shape JSON" щоб не ламати введення при кожному ререндері
  const [shapeDraft, setShapeDraft] = useState<Record<string, string>>({});
  const [shapeError, setShapeError] = useState<Record<string, string>>({});

  const zones: GeoZone[] = Array.isArray(city.geozones) ? city.geozones : [];

  const schedule = useMemo(() => city.deliverySchedule ?? ({ week: [] } as any), [city.deliverySchedule]);

  const week = useMemo(() => ensureWeek(schedule), [schedule]);

  function patchCity(patch: Partial<Omit<CitySettings, "cityId">>) {
    updateCity(cityId, patch as any);
  }

  function updateZone(idx: number, patch: Partial<GeoZone>) {
    const next = zones.map((z, i) => (i === idx ? { ...z, ...patch } : z));
    patchCity({ geozones: next });
  }

  function removeZone(idx: number) {
    const z = zones[idx];
    const id = String(z?.id ?? "");
    setShapeDraft((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
    setShapeError((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
    patchCity({ geozones: zones.filter((_, i) => i !== idx) });
  }

  function addZone() {
    const next: GeoZone = {
      id: uid("zone"),
      name: "Нова зона",
      deliveryFee: 0,
      minOrderAmount: 0,
      etaMinutes: 45,
      shape: shapeCircle(50.45, 30.523, 4000),
    };
    patchCity({ geozones: [...zones, next] });
  }

  function updateWeek(day: number, patch: Partial<{ enabled: boolean; from: string; to: string }>) {
    const nextWeek = week.map((w) => (w.day === day ? { ...w, ...patch } : w));
    patchCity({ deliverySchedule: { ...schedule, week: nextWeek } });
  }

  function updateException(idx: number, patch: any) {
    const list = Array.isArray(schedule.exceptions) ? schedule.exceptions : [];
    const next = list.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    patchCity({ deliverySchedule: { ...schedule, exceptions: next } });
  }

  function addException() {
    const list = Array.isArray(schedule.exceptions) ? schedule.exceptions : [];
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    patchCity({
      deliverySchedule: {
        ...schedule,
        exceptions: [...list, { date: `${y}-${m}-${d}`, enabled: false, note: "" }],
      },
    });
  }

  function removeException(idx: number) {
    const list = Array.isArray(schedule.exceptions) ? schedule.exceptions : [];
    patchCity({ deliverySchedule: { ...schedule, exceptions: list.filter((_, i) => i !== idx) } });
  }

  function setPayments(patch: any) {
    patchCity({ payments: { ...city.payments, ...patch } });
  }

  function setTaxes(patch: any) {
    patchCity({ taxes: { ...city.taxes, ...patch } });
  }

  function setIntegrations(patch: any) {
    patchCity({ integrations: { ...city.integrations, ...patch } });
  }

  function applyShapeJson(zoneId: string, zoneIdx: number) {
    const raw = (shapeDraft[zoneId] ?? "").trim();
    if (!raw) {
      setShapeError((e) => ({ ...e, [zoneId]: "" }));
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      updateZone(zoneIdx, { shape: parsed });
      setShapeError((e) => ({ ...e, [zoneId]: "" }));
    } catch (err: any) {
      setShapeError((e) => ({ ...e, [zoneId]: String(err?.message ?? "Невірний JSON") }));
    }
  }

  return (
    <div className="ui-grid">
      <Section
        title="Комісії"
        subtitle={
          <>
            Комісія платформи та (опційно) частка курʼєра/партнера. Значення застосовуються в розрахунку замовлення.
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div className="ui-field">
            <div className="ui-label">Платформа, %</div>
            <Input
              type="number"
              min={0}
              max={100}
              value={String(city.commissions?.platformPercent ?? 0)}
              onChange={(e) =>
                patchCity({ commissions: { ...city.commissions, platformPercent: clampPercent(num(e.target.value, 0)) } as any })
              }
            />
          </div>

          <div className="ui-field">
            <div className="ui-label">Платформа, фікс</div>
            <Input
              type="number"
              min={0}
              value={String(city.commissions?.platformFixed ?? 0)}
              onChange={(e) => patchCity({ commissions: { ...city.commissions, platformFixed: num(e.target.value, 0) } as any })}
            />
          </div>

          <div className="ui-field">
            <div className="ui-label">Курʼєр/партнер, %</div>
            <Input
              type="number"
              min={0}
              max={100}
              value={String(city.commissions?.courierPercent ?? 0)}
              onChange={(e) =>
                patchCity({ commissions: { ...city.commissions, courierPercent: clampPercent(num(e.target.value, 0)) } as any })
              }
            />
          </div>

          <div className="ui-field">
            <div className="ui-label">Курʼєр/партнер, фікс</div>
            <Input
              type="number"
              min={0}
              value={String(city.commissions?.courierFixed ?? 0)}
              onChange={(e) => patchCity({ commissions: { ...city.commissions, courierFixed: num(e.target.value, 0) } as any })}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Геозони"
        subtitle={
          <>
            Список зон доставки та правила для кожної. Поки що — простий редактор (для складних полігонів можна задати shape JSON).
          </>
        }
        right={
          <SecondaryButton type="button" onClick={addZone}>
            Додати зону
          </SecondaryButton>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {!zones.length ? <div className="ui-subtitle">Поки немає жодної геозони. Додайте першу зону.</div> : null}

          {zones.map((z, idx) => {
            const id = String(z.id ?? `${idx}`);
            const circle = circleFromShape(z.shape);
            const currentDraft = shapeDraft[id] ?? (z.shape ? JSON.stringify(z.shape, null, 2) : "");

            return (
              <div key={id} className="ui-row" style={{ padding: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "grid", gap: 6, flex: 1, minWidth: 0 }}>
                    <div className="ui-label">Назва зони</div>
                    <Input value={z.name ?? ""} onChange={(e) => updateZone(idx, { name: e.target.value })} />
                  </div>
                  <SecondaryButton
                    type="button"
                    style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)" }}
                    onClick={() => removeZone(idx)}
                  >
                    Видалити
                  </SecondaryButton>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <div className="ui-field">
                    <div className="ui-label">Доставка, грн</div>
                    <Input type="number" min={0} value={String(z.deliveryFee ?? 0)} onChange={(e) => updateZone(idx, { deliveryFee: num(e.target.value, 0) })} />
                  </div>
                  <div className="ui-field">
                    <div className="ui-label">Мін. сума</div>
                    <Input type="number" min={0} value={String(z.minOrderAmount ?? 0)} onChange={(e) => updateZone(idx, { minOrderAmount: num(e.target.value, 0) })} />
                  </div>
                  <div className="ui-field">
                    <div className="ui-label">ETA, хв</div>
                    <Input type="number" min={0} value={String(z.etaMinutes ?? 0)} onChange={(e) => updateZone(idx, { etaMinutes: num(e.target.value, 0) })} />
                  </div>
                </div>

                <div className="ui-divider" style={{ margin: "6px 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <div className="ui-field">
                    <div className="ui-label">Центр (lat)</div>
                    <Input
                      type="number"
                      step="0.000001"
                      value={String(circle.lat)}
                      onChange={(e) => updateZone(idx, { shape: shapeCircle(num(e.target.value, 0), circle.lng, circle.radius) })}
                    />
                  </div>
                  <div className="ui-field">
                    <div className="ui-label">Центр (lng)</div>
                    <Input
                      type="number"
                      step="0.000001"
                      value={String(circle.lng)}
                      onChange={(e) => updateZone(idx, { shape: shapeCircle(circle.lat, num(e.target.value, 0), circle.radius) })}
                    />
                  </div>
                  <div className="ui-field">
                    <div className="ui-label">Радіус, м</div>
                    <Input
                      type="number"
                      min={0}
                      value={String(circle.radius)}
                      onChange={(e) => updateZone(idx, { shape: shapeCircle(circle.lat, circle.lng, num(e.target.value, 0)) })}
                    />
                  </div>
                </div>

                <details style={{ marginTop: 6 }}>
                  <summary style={{ cursor: "pointer", color: "var(--muted)", fontWeight: 900 }}>
                    Розширено: shape (JSON)
                  </summary>
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    <div className="ui-subtitle">
                      Можна вставити GeoJSON Polygon або інший формат. Натисніть “Застосувати”, щоб зберегти.
                    </div>
                    <Textarea
                      value={currentDraft}
                      onChange={(e) => setShapeDraft((d) => ({ ...d, [id]: e.target.value }))}
                      placeholder='Напр.: {"type":"FeatureCollection","features":[]}'
                      style={{ minHeight: 120 }}
                    />
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <SecondaryButton
                        type="button"
                        onClick={() => {
                          setShapeDraft((d) => ({ ...d, [id]: JSON.stringify(shapeCircle(circle.lat, circle.lng, circle.radius), null, 2) }));
                          setShapeError((e) => ({ ...e, [id]: "" }));
                        }}
                      >
                        Поставити коло
                      </SecondaryButton>
                      <SecondaryButton type="button" onClick={() => applyShapeJson(id, idx)}>
                        Застосувати
                      </SecondaryButton>
                    </div>
                    {shapeError[id] ? <div className="ui-subtitle" style={{ color: "crimson" }}>{shapeError[id]}</div> : null}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Графік доставки"
        subtitle={
          <>
            Тайм-слоти для оформлення замовлення: дні тижня + винятки (свята/переноси). Day: 0..6 (0=Нд).
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Часовий пояс графіка</div>
              <Input
                value={String(schedule.timezone ?? city.timezone ?? "Europe/Kyiv")}
                onChange={(e) => patchCity({ deliverySchedule: { ...schedule, timezone: e.target.value } })}
              />
            </div>
            <div className="ui-subtitle" style={{ alignSelf: "end" }}>
              Порада: зазвичай збігається з часовим поясом міста.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {week.map((d) => (
              <div key={d.day} className="ui-row" style={{ padding: 10, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950 }}>{dayLabels[d.day]}</div>
                  <label className="ui-checkRow" style={{ justifyContent: "flex-end" }}>
                    <input type="checkbox" checked={d.enabled} onChange={(e) => updateWeek(d.day, { enabled: e.target.checked })} />
                    Працює
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="ui-field">
                    <div className="ui-label">З</div>
                    <Input type="time" value={d.from} disabled={!d.enabled} onChange={(e) => updateWeek(d.day, { from: e.target.value })} />
                  </div>
                  <div className="ui-field">
                    <div className="ui-label">До</div>
                    <Input type="time" value={d.to} disabled={!d.enabled} onChange={(e) => updateWeek(d.day, { to: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ui-divider" style={{ margin: "4px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 950 }}>Винятки</div>
              <div className="ui-subtitle" style={{ marginTop: 6 }}>
                Дні, що відрізняються від звичайного тижневого графіка.
              </div>
            </div>
            <SecondaryButton type="button" onClick={addException}>
              Додати виняток
            </SecondaryButton>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {(schedule.exceptions ?? []).length === 0 ? (
              <div className="ui-subtitle">Поки немає винятків.</div>
            ) : null}

            {(schedule.exceptions ?? []).map((ex: any, idx: number) => (
              <div key={`${ex.date ?? idx}_${idx}`} className="ui-row" style={{ padding: 10, display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 120px", gap: 10, alignItems: "end" }}>
                  <div className="ui-field">
                    <div className="ui-label">Дата</div>
                    <Input type="date" value={String(ex.date ?? "")} onChange={(e) => updateException(idx, { date: e.target.value })} />
                  </div>

                  <div className="ui-field">
                    <div className="ui-label">Примітка</div>
                    <Input value={String(ex.note ?? "")} onChange={(e) => updateException(idx, { note: e.target.value })} placeholder="Напр.: Свято" />
                  </div>

                  <SecondaryButton
                    type="button"
                    style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)" }}
                    onClick={() => removeException(idx)}
                  >
                    Видалити
                  </SecondaryButton>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "170px 1fr 1fr", gap: 10, alignItems: "center" }}>
                  <label className="ui-checkRow">
                    <input type="checkbox" checked={Boolean(ex.enabled)} onChange={(e) => updateException(idx, { enabled: e.target.checked })} />
                    Працює
                  </label>

                  <div className="ui-field">
                    <div className="ui-label">З</div>
                    <Input type="time" value={String(ex.from ?? "09:00")} disabled={!ex.enabled} onChange={(e) => updateException(idx, { from: e.target.value })} />
                  </div>

                  <div className="ui-field">
                    <div className="ui-label">До</div>
                    <Input type="time" value={String(ex.to ?? "21:00")} disabled={!ex.enabled} onChange={(e) => updateException(idx, { to: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Оплати та податки"
        subtitle={
          <>
            Увімкнення методів оплат, провайдер (manual/liqpay/wayforpay/stripe) та VAT.
          </>
        }
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            <label className="ui-checkRow">
              <input
                type="checkbox"
                checked={Boolean(city.payments?.methods?.cash)}
                onChange={(e) => setPayments({ methods: { ...city.payments?.methods, cash: e.target.checked } })}
              />
              Готівка
            </label>
            <label className="ui-checkRow">
              <input
                type="checkbox"
                checked={Boolean(city.payments?.methods?.cardOnDelivery)}
                onChange={(e) => setPayments({ methods: { ...city.payments?.methods, cardOnDelivery: e.target.checked } })}
              />
              Картка при отриманні
            </label>
            <label className="ui-checkRow">
              <input
                type="checkbox"
                checked={Boolean(city.payments?.methods?.online)}
                onChange={(e) => setPayments({ methods: { ...city.payments?.methods, online: e.target.checked } })}
              />
              Онлайн
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "end" }}>
            <div className="ui-field">
              <div className="ui-label">Провайдер оплат</div>
              <Select
                value={String(city.payments?.provider ?? "manual")}
                onChange={(e) => setPayments({ provider: e.target.value })}
              >
                <option value="manual">manual</option>
                <option value="liqpay">liqpay</option>
                <option value="wayforpay">wayforpay</option>
                <option value="stripe">stripe</option>
              </Select>
            </div>

            <div className="ui-subtitle">
              Ключі зберігаються в БД. У UI не показуйте їх публічно.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Public key / ID</div>
              <Input
                value={String(city.payments?.providerConfig?.publicKey ?? "")}
                onChange={(e) => setPayments({ providerConfig: { ...city.payments?.providerConfig, publicKey: e.target.value } })}
              />
            </div>
            <div className="ui-field">
              <div className="ui-label">Secret key</div>
              <Input
                value={String(city.payments?.providerConfig?.secretKey ?? "")}
                onChange={(e) => setPayments({ providerConfig: { ...city.payments?.providerConfig, secretKey: e.target.value } })}
              />
            </div>
            <div className="ui-field">
              <div className="ui-label">Webhook secret (опц.)</div>
              <Input
                value={String(city.payments?.providerConfig?.webhookSecret ?? "")}
                onChange={(e) => setPayments({ providerConfig: { ...city.payments?.providerConfig, webhookSecret: e.target.value } })}
              />
            </div>
            <div className="ui-field">
              <div className="ui-label">Merchant / account (опц.)</div>
              <Input
                value={String(city.payments?.providerConfig?.merchant ?? "")}
                onChange={(e) => setPayments({ providerConfig: { ...city.payments?.providerConfig, merchant: e.target.value } })}
              />
            </div>
          </div>

          <div className="ui-divider" style={{ margin: "4px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, alignItems: "end" }}>
            <div className="ui-field">
              <div className="ui-label">VAT, %</div>
              <Input
                type="number"
                min={0}
                max={100}
                value={String(city.taxes?.vatPercent ?? 0)}
                onChange={(e) => setTaxes({ vatPercent: clampPercent(num(e.target.value, 0)) })}
              />
            </div>
            <label className="ui-checkRow">
              <input
                type="checkbox"
                checked={Boolean(city.taxes?.includedInPrice)}
                onChange={(e) => setTaxes({ includedInPrice: e.target.checked })}
              />
              VAT включено в ціну
            </label>
          </div>
        </div>
      </Section>

      <Section
        title="Інтеграції"
        subtitle={
          <>
            Telegram / Viber на рівні міста. Тут тільки реквізити та вмикання (відправка/лог — наступним кроком).
          </>
        }
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div className="ui-row" style={{ padding: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 950 }}>Telegram</div>
              <label className="ui-checkRow" style={{ justifyContent: "flex-end" }}>
                <input
                  type="checkbox"
                  checked={Boolean(city.integrations?.telegram?.enabled)}
                  onChange={(e) => setIntegrations({ telegram: { ...city.integrations?.telegram, enabled: e.target.checked } })}
                />
                Увімкнено
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Bot token</div>
                <Input
                  value={String(city.integrations?.telegram?.botToken ?? "")}
                  onChange={(e) => setIntegrations({ telegram: { ...city.integrations?.telegram, botToken: e.target.value } })}
                />
              </div>
              <div className="ui-field">
                <div className="ui-label">Chat ID / Channel</div>
                <Input
                  value={String(city.integrations?.telegram?.chatId ?? "")}
                  onChange={(e) => setIntegrations({ telegram: { ...city.integrations?.telegram, chatId: e.target.value } })}
                />
              </div>
            </div>
          </div>

          <div className="ui-row" style={{ padding: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 950 }}>Viber</div>
              <label className="ui-checkRow" style={{ justifyContent: "flex-end" }}>
                <input
                  type="checkbox"
                  checked={Boolean(city.integrations?.viber?.enabled)}
                  onChange={(e) => setIntegrations({ viber: { ...city.integrations?.viber, enabled: e.target.checked } })}
                />
                Увімкнено
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Token</div>
                <Input
                  value={String(city.integrations?.viber?.token ?? "")}
                  onChange={(e) => setIntegrations({ viber: { ...city.integrations?.viber, token: e.target.value } })}
                />
              </div>
              <div className="ui-field">
                <div className="ui-label">Sender ID (опц.)</div>
                <Input
                  value={String(city.integrations?.viber?.senderId ?? "")}
                  onChange={(e) => setIntegrations({ viber: { ...city.integrations?.viber, senderId: e.target.value } })}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
