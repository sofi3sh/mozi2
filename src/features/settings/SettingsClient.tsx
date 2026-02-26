"use client";

import React, { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, Select } from "@/components/ui/Input";
import { useSettings } from "@/store/settings";
import { useCityScope } from "@/store/cityScope";

import CitySettingsForm from "@/features/settings/city/CitySettingsForm";
import SiteSettingsForm from "@/features/settings/site/SiteSettingsForm";

type Tab = "global" | "city" | "notifications";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={active ? "ui-chip ui-chip--active" : "ui-chip"}
      type="button"
      style={{ background: active ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.02)" }}
    >
      {children}
    </button>
  );
}

export default function SettingsClient({ cityId }: { cityId: string }) {
  const { getCity, updateCity } = useSettings();
  const { cities } = useCityScope();
  const city = getCity(cityId);

  const [tab, setTab] = useState<Tab>("city");
  const cityName = useMemo(() => cities.find((c) => c.id === cityId)?.name ?? cityId, [cities, cityId]);
  const [saveHint, setSaveHint] = useState<string | null>(null);

  const geozoneCount = Array.isArray(city.geozones) ? city.geozones.length : 0;
  const vatPercent = (city.taxes?.vatPercent ?? 0) as number;
  const activeIntegrations = (city.integrations?.telegram?.enabled ? 1 : 0) + (city.integrations?.viber?.enabled ? 1 : 0);

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title="Розділи"
          subtitle="Перемикайтеся між налаштуваннями: сайт / місто / нотифікації. Зміни зберігаються в БД." 
          right={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <TabButton active={tab === "city"} onClick={() => setTab("city")}>
                Місто
              </TabButton>
              <TabButton active={tab === "global"} onClick={() => setTab("global")}>
                Сайт
              </TabButton>
              <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>
                Нотифікації
              </TabButton>
            </div>
          }
        />
        <div className="ui-subtitle">
          Зараз активний: <Badge>{tab === "city" ? `Місто: ${cityName}` : tab === "global" ? "Сайт" : "Нотифікації"}</Badge>
        </div>
      </Card>

      {tab === "global" ? (
        <Card>
          <CardHeader title="Налаштування сайту" subtitle="Повноцінні налаштування (на всю ширину). Зміни зберігаються в БД." />
          <SiteSettingsForm />
        </Card>
      ) : null}

      {tab === "city" ? (
        <Card>
          <CardHeader title={`Налаштування міста — ${cityName}`} subtitle="Параметри діють лише для вибраного міста." />

          <div className="ui-twoCol">
            <div className="ui-grid">
              <div className="ui-row" style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="ui-field">
                    <div className="ui-label">Валюта</div>
                    <Select value={city.currency} onChange={(e) => updateCity(cityId, { currency: e.target.value as any })}>
                      <option value="UAH">UAH</option>
                    </Select>
                  </div>

                  <div className="ui-field">
                    <div className="ui-label">Часовий пояс</div>
                    <Input value={city.timezone} onChange={(e) => updateCity(cityId, { timezone: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label className="ui-checkRow">
                    <input type="checkbox" checked={city.deliveryEnabled} onChange={(e) => updateCity(cityId, { deliveryEnabled: e.target.checked })} />
                    Доставка увімкнена
                  </label>

                  <label className="ui-checkRow">
                    <input type="checkbox" checked={city.pickupEnabled} onChange={(e) => updateCity(cityId, { pickupEnabled: e.target.checked })} />
                    Самовивіз увімкнений
                  </label>
                </div>

                <label className="ui-checkRow">
                  <input type="checkbox" checked={city.orderAutoAccept} onChange={(e) => updateCity(cityId, { orderAutoAccept: e.target.checked })} />
                  Автоприйом замовлень
                </label>

                <div className="ui-field">
                  <div className="ui-label">Мінімальна сума замовлення</div>
                  <Input type="number" min={0} value={String(city.minOrderAmount)} onChange={(e) => updateCity(cityId, { minOrderAmount: Number(e.target.value || 0) })} />
                </div>

                <div className="ui-actions">
                  <Button
                    type="button"
                    onClick={() => {
                      updateCity(cityId, {} as any);
                      setSaveHint("Збережено в БД");
                      window.setTimeout(() => setSaveHint(null), 1800);
                    }}
                  >
                    Зберегти
                  </Button>
                </div>

                {saveHint ? <div className="ui-subtitle">{saveHint}</div> : null}
              </div>

              <CitySettingsForm cityId={cityId} />
            </div>

            <div className="ui-grid">
              <div className="ui-row">
                <div className="ui-label">Швидкий огляд</div>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  <div className="ui-subtitle">
                    Доставка: <b>{city.deliveryEnabled ? "так" : "ні"}</b>
                  </div>
                  <div className="ui-subtitle">
                    Самовивіз: <b>{city.pickupEnabled ? "так" : "ні"}</b>
                  </div>
                  <div className="ui-subtitle">
                    Автоприйом: <b>{city.orderAutoAccept ? "так" : "ні"}</b>
                  </div>
                  <div className="ui-subtitle">
                    Мін. сума: <b>{city.minOrderAmount} {city.currency}</b>
                  </div>
                  <div className="ui-subtitle">
                    Геозони: <b>{geozoneCount}</b>
                  </div>
                  <div className="ui-subtitle">
                    VAT: <b>{vatPercent}%</b>
                  </div>
                  <div className="ui-subtitle">
                    Інтеграції: <b>{activeIntegrations} активні</b>
                  </div>
                </div>
              </div>

              <div className="ui-row">
                <div className="ui-label">Підказки</div>
                <div className="ui-subtitle" style={{ marginTop: 8 }}>
                  1) Вимкніть доставку → на сайті в цьому місті сховати “Доставка”.<br />
                  2) Увімкніть автоприйом → замовлення одразу в “В процесі”.<br />
                  3) Мін. сума → блокувати кошик нижче порогу.
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {tab === "notifications" ? (
        <Card>
          <CardHeader title="Нотифікації" subtitle="MVP-заглушка. Додамо Telegram, email, webhooks." />
          <div className="ui-row" style={{ display: "grid", gap: 8 }}>
            <div className="ui-subtitle">
              Наступний крок: зробимо шаблони повідомлень по статусах (new/in_progress/delivered), підключення Telegram bot, і лог подій.
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
