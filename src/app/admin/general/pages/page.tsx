"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/Page";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";
import { useSettings, type CmsPage } from "@/store/settings";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function uid() {
  // crypto.randomUUID is available in modern browsers
  // fallback for older environments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = typeof crypto !== "undefined" ? crypto : null;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return "p_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function sanitizeSlug(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

const RESERVED = new Set(["about", "terms", "contacts"]);

export default function GeneralPagesPage() {
  const { global, updateGlobal } = useSettings();

  const [draft, setDraft] = useState<CmsPage[]>(() => clone(global.pages || []));
  const [selectedId, setSelectedId] = useState<string>(() => (draft[0]?.id ? draft[0].id : ""));

  useEffect(() => {
    const next = clone(global.pages || []);
    setDraft(next);
    if (!next.find((p) => p.id === selectedId)) setSelectedId(next[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global.pages]);

  const selected = useMemo(() => draft.find((p) => p.id === selectedId) ?? null, [draft, selectedId]);

  function updatePage(id: string, patch: Partial<CmsPage>) {
    setDraft((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addPage() {
    const id = uid();
    const page: CmsPage = {
      id,
      slug: "news",
      title: { ua: "Нова сторінка", ru: "Новая страница" },
      content: { ua: "", ru: "" },
      showInFooter: true,
      footerOrder: (draft.length + 1) * 10,
    };
    setDraft((prev) => [page, ...prev]);
    setSelectedId(id);
  }

  function removePage(id: string) {
    const p = draft.find((x) => x.id === id);
    if (!p) return;
    if (RESERVED.has(p.slug)) return;
    const next = draft.filter((x) => x.id !== id);
    setDraft(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? "");
  }

  function save() {
    // sanitize slugs + ensure uniqueness
    const used = new Set<string>();
    const fixed = draft.map((p) => {
      const slug0 = sanitizeSlug(p.slug);
      let slug = slug0 || "page";
      let i = 2;
      while (used.has(slug)) {
        slug = `${slug0 || "page"}-${i++}`;
      }
      used.add(slug);
      return { ...p, slug };
    });
    updateGlobal({ pages: fixed });
  }

  const footerHint = (
    <div style={{ opacity: 0.75, fontWeight: 750, lineHeight: 1.45 }}>
      Сторінки керуються тут і відображаються на сайті. Посилання у футері беруться з полів <b>“Показувати у футері”</b>.
      Додаткові сторінки відкриваються за адресою <b>/p/&lt;slug&gt;</b> (наприклад: <b>/p/news</b>).
    </div>
  );

  return (
    <div className="ui-grid">
      <PageHeader
        title="Сторінки"
        description={footerHint}
        actions={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <SecondaryButton type="button" onClick={() => setDraft(clone(global.pages || []))}>
              Скасувати
            </SecondaryButton>
            <Button type="button" onClick={save}>
              Зберегти
            </Button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14, alignItems: "start" }}>
        <Card>
          <CardHeader
            title="Список сторінок"
            subtitle="Про нас / Контакти / Угода користувача + будь-які додаткові (Новини тощо)."
          />
          <div style={{ padding: 14, display: "grid", gap: 10 }}>
            <Button type="button" onClick={addPage}>
              + Додати сторінку
            </Button>

            <div style={{ display: "grid", gap: 8 }}>
              {draft
                .slice()
                .sort((a, b) => (a.footerOrder ?? 0) - (b.footerOrder ?? 0))
                .map((p) => {
                  const active = p.id === selectedId;
                  const title = p.title?.ua || p.slug;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: active ? "1px solid rgba(47,123,246,0.55)" : "1px solid rgba(31,41,55,0.10)",
                        background: active ? "rgba(47,123,246,0.10)" : "rgba(255,255,255,0.55)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>{title}</div>
                      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                        slug: <b>{p.slug}</b> • {p.showInFooter ? "у футері" : "не у футері"}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Редагування" subtitle={selected ? `slug: ${selected.slug}` : "Оберіть сторінку зі списку"} />
          {selected ? (
            <div style={{ padding: 14, display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="ui-field">
                  <div className="ui-label">Slug</div>
                  <Input
                    value={selected.slug}
                    disabled={RESERVED.has(selected.slug)}
                    onChange={(e) => updatePage(selected.id, { slug: e.target.value })}
                    placeholder="news"
                  />
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7, fontWeight: 750, lineHeight: 1.35 }}>
                    Для додаткових сторінок адреса буде <b>/p/{sanitizeSlug(selected.slug || "...")}</b>.
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <label className="ui-checkRow">
                    <input
                      type="checkbox"
                      checked={!!selected.showInFooter}
                      onChange={(e) => updatePage(selected.id, { showInFooter: e.target.checked })}
                    />
                    Показувати у футері
                  </label>

                  <div className="ui-field">
                    <div className="ui-label">Порядок у футері</div>
                    <Input
                      type="number"
                      value={String(selected.footerOrder ?? 0)}
                      onChange={(e) => updatePage(selected.id, { footerOrder: Number(e.target.value || 0) })}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="ui-field">
                  <div className="ui-label">Заголовок (UA)</div>
                  <Input
                    value={selected.title?.ua ?? ""}
                    onChange={(e) => updatePage(selected.id, { title: { ...selected.title, ua: e.target.value } })}
                    placeholder="Про нас"
                  />
                </div>
                <div className="ui-field">
                  <div className="ui-label">Заголовок (RU)</div>
                  <Input
                    value={selected.title?.ru ?? ""}
                    onChange={(e) => updatePage(selected.id, { title: { ...selected.title, ru: e.target.value } })}
                    placeholder="О нас"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="ui-field">
                  <div className="ui-label">Контент (UA)</div>
                  <Textarea
                    value={selected.content?.ua ?? ""}
                    onChange={(e) => updatePage(selected.id, { content: { ...selected.content, ua: e.target.value } })}
                    placeholder="Текст сторінки українською..."
                  />
                </div>
                <div className="ui-field">
                  <div className="ui-label">Контент (RU)</div>
                  <Textarea
                    value={selected.content?.ru ?? ""}
                    onChange={(e) => updatePage(selected.id, { content: { ...selected.content, ru: e.target.value } })}
                    placeholder="Текст сторінки російською..."
                  />
                </div>
              </div>

              {!RESERVED.has(selected.slug) ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 750 }}>
                    Видаляти можна лише додаткові сторінки (не Про нас / Контакти / Угода).
                  </div>
                  <SecondaryButton type="button" onClick={() => removePage(selected.id)}>
                    Видалити сторінку
                  </SecondaryButton>
                </div>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 750 }}>
                  Це системна сторінка — її можна редагувати, але не можна видалити.
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 14, opacity: 0.75, fontWeight: 800 }}>Оберіть сторінку зі списку ліворуч.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
