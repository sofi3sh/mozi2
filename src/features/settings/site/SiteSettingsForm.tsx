"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, SecondaryButton, Select, Textarea } from "@/components/ui/Input";
import { useSettings } from "@/store/settings";

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

function normalizeHost(v: string) {
  return v.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function SiteSettingsForm() {
  const { global, updateGlobal } = useSettings();
  const [saveHint, setSaveHint] = useState<string | null>(null);

  const domains = useMemo(() => (Array.isArray(global.domains) ? global.domains : []), [global.domains]);

  const activeDomainCount = useMemo(() => domains.filter((d) => d.active && d.host.trim()).length, [domains]);
  const primaryDomain = useMemo(() => domains.find((d) => d.isPrimary && d.host.trim())?.host ?? "—", [domains]);

  function patch(p: any) {
    updateGlobal(p);
  }

  function setTheme(p: any) {
    patch({ brandTheme: { ...global.brandTheme, ...p } });
  }

  function setModeration(p: any) {
    patch({ moderation: { ...global.moderation, ...p } });
  }

  function updateDomain(idx: number, p: any) {
    const next = domains.map((d, i) => (i === idx ? { ...d, ...p } : d));
    patch({ domains: next });
  }

  function setPrimary(idx: number) {
    const next = domains.map((d, i) => ({ ...d, isPrimary: i === idx }));
    patch({ domains: next });
  }

  function removeDomain(idx: number) {
    const next = domains.filter((_, i) => i !== idx);
    // якщо видалили primary — призначимо перший активний як primary (якщо є)
    const hasPrimary = next.some((d) => d.isPrimary);
    const next2 = hasPrimary
      ? next
      : next.map((d, i) => ({ ...d, isPrimary: i === 0 }));
    patch({ domains: next2 });
  }

  function addDomain() {
    const next = [
      ...domains,
      {
        id: uid("dom"),
        host: "",
        kind: "domain" as const,
        isPrimary: domains.length === 0,
        active: true,
      },
    ];
    patch({ domains: next });
  }

  return (
    <div className="ui-grid">
      <Section title="Короткий статус" subtitle="Це швидкий огляд ключових налаштувань сайту.">
        <div className="ui-kpis ui-kpis3">
          <div className="ui-kpi">
            <div className="ui-kpiLabel">Домени (активні)</div>
            <div className="ui-kpiValue">{activeDomainCount}</div>
          </div>
          <div className="ui-kpi">
            <div className="ui-kpiLabel">Primary домен</div>
            <div className="ui-kpiValue" style={{ fontSize: 14, lineHeight: 1.2 }}>
              {primaryDomain}
            </div>
          </div>
          <div className="ui-kpi">
            <div className="ui-kpiLabel">Модерація</div>
            <div className="ui-kpiValue" style={{ fontSize: 16 }}>
              {global.moderation?.mode === "auto" ? "Авто" : "Ручна"}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Загальні" subtitle="Базові параметри, які часто потрібні в адмінці та на сайті.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div className="ui-field">
            <div className="ui-label">Назва бренду</div>
            <Input value={global.brandName} onChange={(e) => patch({ brandName: e.target.value })} />
          </div>
          <div className="ui-field">
            <div className="ui-label">Email підтримки</div>
            <Input value={global.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} />
          </div>
          <div className="ui-field" style={{ gridColumn: "span 2" }}>
            <div className="ui-label">Мова за замовчуванням</div>
            <Select value={global.defaultLanguage} onChange={(e) => patch({ defaultLanguage: e.target.value as any })}>
              <option value="ua">UA</option>
              <option value="ru">RU</option>
            </Select>
          </div>
        </div>

        <div className="ui-actions" style={{ marginTop: 12 }}>
          <Button
            type="button"
            onClick={() => {
              patch({} as any);
              setSaveHint("Збережено в БД");
              window.setTimeout(() => setSaveHint(null), 1800);
            }}
          >
            Зберегти
          </Button>
        </div>
        {saveHint ? <div className="ui-subtitle" style={{ marginTop: 8 }}>{saveHint}</div> : null}
      </Section>

      <Section
        title="Домени / піддомени"
        subtitle={
          <>
            Додавайте домени, через які буде відкриватися сайт. Один домен можна зробити <b>Primary</b> (канонічним).
          </>
        }
        right={
          <SecondaryButton type="button" onClick={addDomain}>
            Додати домен
          </SecondaryButton>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {!domains.length ? <div className="ui-subtitle">Поки немає доменів. Додайте перший домен.</div> : null}

          {domains.map((d, idx) => (
            <div key={d.id ?? idx} className="ui-row" style={{ padding: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Badge>{d.kind === "subdomain" ? "subdomain" : "domain"}</Badge>
                  {d.isPrimary ? <Badge>Primary</Badge> : null}
                  {d.active ? <Badge>Active</Badge> : <Badge>Disabled</Badge>}
                </div>
                <SecondaryButton
                  type="button"
                  style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.10)" }}
                  onClick={() => removeDomain(idx)}
                >
                  Видалити
                </SecondaryButton>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div className="ui-field">
                  <div className="ui-label">Host</div>
                  <Input
                    placeholder="example.com або shop.example.com"
                    value={d.host ?? ""}
                    onChange={(e) => updateDomain(idx, { host: normalizeHost(e.target.value) })}
                  />
                </div>
                <div className="ui-field">
                  <div className="ui-label">Тип</div>
                  <Select value={d.kind ?? "domain"} onChange={(e) => updateDomain(idx, { kind: e.target.value as any })}>
                    <option value="domain">Домен</option>
                    <option value="subdomain">Піддомен</option>
                  </Select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <label className="ui-checkRow">
                  <input type="checkbox" checked={Boolean(d.active)} onChange={(e) => updateDomain(idx, { active: e.target.checked })} />
                  Активний
                </label>
                <label className="ui-checkRow">
                  <input type="checkbox" checked={Boolean(d.isPrimary)} onChange={() => setPrimary(idx)} />
                  Primary
                </label>
              </div>

              <div className="ui-subtitle">
                Підказка: для підключення домену зазвичай потрібен DNS (A/CNAME) і SSL. Тут ми зберігаємо конфіг.
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Тема бренду"
        subtitle="Візуальні параметри: кольори, логотип, фавікон. (MVP — зберігаємо конфіг і показуємо превʼю)"
      >
        <div className="ui-siteSplit">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Primary color</div>
                <Input value={global.brandTheme?.primaryColor ?? ""} onChange={(e) => setTheme({ primaryColor: e.target.value })} placeholder="#2f7bf6" />
              </div>
              <div className="ui-field">
                <div className="ui-label">Secondary color</div>
                <Input value={global.brandTheme?.secondaryColor ?? ""} onChange={(e) => setTheme({ secondaryColor: e.target.value })} placeholder="#0b1220" />
              </div>
            </div>

            <div className="ui-field">
              <div className="ui-label">Logo URL</div>
              <Input value={global.brandTheme?.logoUrl ?? ""} onChange={(e) => setTheme({ logoUrl: e.target.value })} placeholder="https://.../logo.png" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Favicon URL</div>
                <Input value={global.brandTheme?.faviconUrl ?? ""} onChange={(e) => setTheme({ faviconUrl: e.target.value })} placeholder="https://.../favicon.ico" />
              </div>
              <div className="ui-field">
                <div className="ui-label">Font family (опційно)</div>
                <Input value={global.brandTheme?.fontFamily ?? ""} onChange={(e) => setTheme({ fontFamily: e.target.value })} placeholder="Inter, system-ui" />
              </div>
            </div>

            <div className="ui-subtitle">
              Пізніше: застосування теми на публічному сайті через CSS variables / конфіг.
            </div>
          </div>

          <div className="ui-preview" style={{ minHeight: 240, width: "100%" }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: 16,
                background: global.brandTheme?.secondaryColor ?? "#0b1220",
                display: "grid",
                alignContent: "center",
                gap: 10,
                borderRadius: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  className="ui-thumb"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderColor: "rgba(255,255,255,0.16)",
                    width: 56,
                    height: 56,
                  }}
                >
                  {global.brandTheme?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={global.brandTheme.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <span className="ui-subtitle">logo</span>
                  )}
                </div>
                <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>{global.brandName}</div>
              </div>

              <div className="ui-subtitle">Підтримка: {global.supportEmail}</div>

              <button
                type="button"
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: global.brandTheme?.primaryColor ?? "#2f7bf6",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                  justifySelf: "start",
                }}
              >
                Приклад кнопки
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Правила модерації" subtitle="Як публікувати відгуки/коментарі/контент користувачів на сайті.">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <div className="ui-field">
              <div className="ui-label">Режим</div>
              <Select value={global.moderation?.mode ?? "manual"} onChange={(e) => setModeration({ mode: e.target.value as any })}>
                <option value="manual">Ручна (через модерацію)</option>
                <option value="auto">Автоматична (одразу публікувати)</option>
              </Select>
            </div>
            <div className="ui-field">
              <div className="ui-label">Дія при порушенні</div>
              <Select value={global.moderation?.action ?? "review"} onChange={(e) => setModeration({ action: e.target.value as any })}>
                <option value="review">Відправити на перевірку</option>
                <option value="hide">Приховати</option>
              </Select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <label className="ui-checkRow">
              <input type="checkbox" checked={Boolean(global.moderation?.blockLinks)} onChange={(e) => setModeration({ blockLinks: e.target.checked })} />
              Блокувати посилання
            </label>
            <div className="ui-field">
              <div className="ui-label">Макс. кількість посилань</div>
              <Input
                type="number"
                min={0}
                value={String(global.moderation?.maxLinks ?? 0)}
                onChange={(e) => setModeration({ maxLinks: Number(e.target.value || 0) })}
              />
            </div>
          </div>

          <div className="ui-field">
            <div className="ui-label">Стоп-слова (по одному в рядку)</div>
            <Textarea
              value={(global.moderation?.bannedWords ?? []).join("\n")}
              onChange={(e) => {
                const list = e.target.value
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                setModeration({ bannedWords: list });
              }}
              placeholder="слово1\nслово2\n..."
            />
          </div>

          <div className="ui-subtitle">
            Примітка: ці правила — конфіг. Реальна модерація/фільтри підключаються у відповідних флоу (відгуки/коментарі).
          </div>
        </div>
      </Section>
    </div>
  );
}
