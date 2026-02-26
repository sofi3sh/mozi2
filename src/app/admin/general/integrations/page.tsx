"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/Page";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton, Select } from "@/components/ui/Input";
import { useSettings, type IntegrationsSettings } from "@/store/settings";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export default function GeneralIntegrationsPage() {
  const { global, updateGlobal } = useSettings();

  const [draft, setDraft] = useState<IntegrationsSettings>(() => clone(global.integrations));

  useEffect(() => {
    setDraft(clone(global.integrations));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global.integrations]);

  function setChannel(key: "telegram" | "viber", patch: any) {
    setDraft((prev) => ({
      ...prev,
      [key]: { ...(prev as any)[key], ...patch },
    }));
  }

  function setPayments(patch: any) {
    setDraft((prev) => ({
      ...prev,
      payments: { ...(prev as any).payments, ...patch },
    }));
  }

  function save() {
    updateGlobal({ integrations: draft });
  }

  return (
    <div className="ui-grid">
      <PageHeader
        title="Інтеграції"
        description={
          <>
            Налаштування інтеграцій — <b>спільні для всіх міст</b>.
          </>
        }
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <SecondaryButton type="button" onClick={() => setDraft(clone(global.integrations))}>
              Скасувати
            </SecondaryButton>
            <Button type="button" onClick={save}>
              Зберегти
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader title="Telegram" subtitle="Bot token + chat id (за потреби)." />
        <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
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
                value={(draft.telegram as any)?.botToken ?? ""}
                onChange={(e) => setChannel("telegram", { botToken: e.target.value })}
                placeholder="123456:ABCDEF..."
              />
            </div>

            <div className="ui-field">
              <div className="ui-label">Chat ID</div>
              <Input
                value={(draft.telegram as any)?.chatId ?? ""}
                onChange={(e) => setChannel("telegram", { chatId: e.target.value })}
                placeholder="-100..."
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Viber" subtitle="Токен + senderId (за потреби)." />
        <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
          <label className="ui-checkRow" style={{ marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={!!draft.viber?.enabled}
              onChange={(e) => setChannel("viber", { enabled: e.target.checked })}
            />
            Увімкнути
          </label>

          <div className="ui-grid" style={{ gap: 10 }}>
            <div className="ui-field">
              <div className="ui-label">Token</div>
              <Input
                value={(draft.viber as any)?.token ?? ""}
                onChange={(e) => setChannel("viber", { token: e.target.value })}
                placeholder="..."
              />
            </div>

            <div className="ui-field">
              <div className="ui-label">Sender ID</div>
              <Input
                value={(draft.viber as any)?.senderId ?? ""}
                onChange={(e) => setChannel("viber", { senderId: e.target.value })}
                placeholder="..."
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Платіжний метод"
          subtitle="Налаштування онлайн-оплати (готівки та оплати курʼєру немає)."
        />
        <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
          <label className="ui-checkRow" style={{ marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={!!(draft as any).payments?.enabled}
              onChange={(e) => setPayments({ enabled: e.target.checked })}
            />
            Увімкнути
          </label>

          <div className="ui-grid" style={{ gap: 10 }}>
            <div className="ui-field">
              <div className="ui-label">Провайдер</div>
              <Select
                value={((draft as any).payments?.provider ?? "manual") as string}
                onChange={(e) => setPayments({ provider: e.target.value })}
              >
                <option value="manual">Manual (поки без інтеграції)</option>
                <option value="stripe">Stripe</option>
                <option value="wayforpay">WayForPay</option>
                <option value="liqpay">LiqPay</option>
                <option value="privatpay">PrivatPay</option>
                <option value="monopay">MonoPay</option>
              </Select>
              <div style={{ marginTop: 8, opacity: 0.7, fontWeight: 700, fontSize: 13, lineHeight: 1.35 }}>
                Зараз це лише налаштування (щоб підключити інтеграції пізніше). Оплата передбачена тільки одразу (online).
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
