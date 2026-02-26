"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/Page";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton, Select, Textarea } from "@/components/ui/Input";
import { useSettings, type NotificationTemplate, type NotificationsSettings } from "@/store/settings";
import type { OrderStatus } from "@/store/orders";

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "preorder", label: "Передзамовлення" },
  { value: "new", label: "Нове" },
  { value: "in_progress", label: "В роботі" },
  { value: "delivered", label: "Доставлено" },
  { value: "cancelled", label: "Скасовано" },
];

function cloneNotifications(n: NotificationsSettings): NotificationsSettings {
  // глибока копія, щоб редагування не мутувало store
  return JSON.parse(JSON.stringify(n)) as NotificationsSettings;
}

export default function CitySettingsPage({ params }: { params: { cityId: string } }) {
  const { cityId } = params;
  const { getCity, updateCity } = useSettings();
  const city = getCity(cityId);

  const [draft, setDraft] = useState<NotificationsSettings>(city.notifications);
  const [status, setStatus] = useState<OrderStatus>("new");

  useEffect(() => {
    setDraft(cloneNotifications(city.notifications));
  }, [cityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const tpl = useMemo<NotificationTemplate>(() => {
    return draft.templates?.[status] ?? { telegramText: "", emailSubject: "", emailBody: "", webhookPayload: "{}" };
  }, [draft, status]);

  function setChannel<K extends keyof NotificationsSettings>(key: K, patch: any) {
    setDraft((prev) => ({ ...prev, [key]: { ...(prev as any)[key], ...patch } }));
  }

  function setTemplate(patch: Partial<NotificationTemplate>) {
    setDraft((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [status]: { ...(prev.templates?.[status] ?? tpl), ...patch },
      },
    }));
  }

  const webhookLines = (draft.webhooks?.urls ?? []).join("\n");

  function save() {
    updateCity(cityId, { notifications: draft });
  }

  return (
    <div className="ui-grid">
      <PageHeader
        title={<>Налаштування міста: <b>{cityId}</b></>}
        description={
          <>
            Тут — <b>нотифікації</b> та <b>шаблони повідомлень</b>. Графік доставки зі сторінки налаштувань прибрано —
            винятки задаються в графіку закладу (в «Додати/Редагувати заклад»).
          </>
        }
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <SecondaryButton type="button" onClick={() => setDraft(cloneNotifications(city.notifications))}>
              Скасувати
            </SecondaryButton>
            <Button type="button" onClick={save}>
              Зберегти
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader
          title="Нотифікації"
          subtitle="Увімкніть канали та налаштуйте параметри відправки."
        />

        <div className="ui-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
            <div style={{ fontWeight: 950, marginBottom: 10 }}>Telegram</div>
            <label className="ui-checkRow" style={{ marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={!!draft.telegram?.enabled}
                onChange={(e) => setChannel("telegram", { enabled: e.target.checked })}
              />
              Увімкнути
            </label>

            <div className="ui-grid" style={{ gap: 10 }}>
              <div className="ui-field">
                <div className="ui-label">Bot token</div>
                <Input
                  value={draft.telegram?.botToken ?? ""}
                  onChange={(e) => setChannel("telegram", { botToken: e.target.value })}
                  placeholder="123456:ABCDEF..."
                />
              </div>
              <div className="ui-field">
                <div className="ui-label">Chat ID</div>
                <Input
                  value={draft.telegram?.chatId ?? ""}
                  onChange={(e) => setChannel("telegram", { chatId: e.target.value })}
                  placeholder="-100..."
                />
              </div>
            </div>
          </div>

          <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
            <div style={{ fontWeight: 950, marginBottom: 10 }}>Email</div>
            <label className="ui-checkRow" style={{ marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={!!draft.email?.enabled}
                onChange={(e) => setChannel("email", { enabled: e.target.checked })}
              />
              Увімкнути
            </label>

            <div className="ui-grid" style={{ gap: 10 }}>
              <div className="ui-field">
                <div className="ui-label">From</div>
                <Input
                  value={draft.email?.from ?? ""}
                  onChange={(e) => setChannel("email", { from: e.target.value })}
                  placeholder="no-reply@example.com"
                />
              </div>
              <div className="ui-field">
                <div className="ui-label">To (за замовчуванням)</div>
                <Input
                  value={draft.email?.to ?? ""}
                  onChange={(e) => setChannel("email", { to: e.target.value })}
                  placeholder="ops@example.com"
                />
              </div>
            </div>
          </div>

          <div className="ui-card ui-card--soft" style={{ padding: 14, gridColumn: "1 / -1" }}>
            <div style={{ fontWeight: 950, marginBottom: 10 }}>Webhooks</div>
            <label className="ui-checkRow" style={{ marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={!!draft.webhooks?.enabled}
                onChange={(e) => setChannel("webhooks", { enabled: e.target.checked })}
              />
              Увімкнути
            </label>

            <div className="ui-field">
              <div className="ui-label">URLs (по одному на рядок)</div>
              <Textarea
                value={webhookLines}
                onChange={(e) => setChannel("webhooks", { urls: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
                rows={4}
                placeholder="https://hooks...\nhttps://..."
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Шаблони повідомлень по статусах"
          subtitle="Тексти для Telegram / Email / Webhook-пейлоад."
          right={
            <div style={{ minWidth: 220 }}>
              <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          }
        />

        <div className="ui-siteSplit">
          <div className="ui-grid">
            <div className="ui-field">
              <div className="ui-label">Telegram текст</div>
              <Textarea value={tpl.telegramText} onChange={(e) => setTemplate({ telegramText: e.target.value })} rows={4} />
            </div>

            <div className="ui-field">
              <div className="ui-label">Email subject</div>
              <Input value={tpl.emailSubject} onChange={(e) => setTemplate({ emailSubject: e.target.value })} />
            </div>

            <div className="ui-field">
              <div className="ui-label">Email body</div>
              <Textarea value={tpl.emailBody} onChange={(e) => setTemplate({ emailBody: e.target.value })} rows={6} />
            </div>

            <div className="ui-field">
              <div className="ui-label">Webhook payload (JSON / текст)</div>
              <Textarea value={tpl.webhookPayload} onChange={(e) => setTemplate({ webhookPayload: e.target.value })} rows={6} />
            </div>
          </div>

          <div className="ui-card ui-card--soft" style={{ padding: 14, alignSelf: "start" }}>
            <div style={{ fontWeight: 950 }}>Підказки</div>
            <div className="ui-subtitle" style={{ marginTop: 8 }}>
              Можна використовувати змінні в форматі <b>{"{{variable}}"}</b>.
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {[
                "order_number",
                "status",
                "total",
                "deliver_at",
                "address",
                "comment",
                "cancel_reason",
              ].map((x) => (
                <div key={x} className="ui-row" style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 950 }}>{`{{${x}}}`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
