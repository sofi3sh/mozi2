"use client";

import React, { useMemo, useState } from "react";
import { clearSeoMode } from "./useSeoMode";
import { makeEmptyEntry, SeoLang, useSeo } from "@/store/seo";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(31,41,55,0.12)",
        background: "rgba(255,255,255,0.78)",
        outline: "none",
        fontWeight: 800,
      }}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(31,41,55,0.12)",
        background: "rgba(255,255,255,0.78)",
        outline: "none",
        fontWeight: 800,
        resize: "vertical",
      }}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const flip = () => onChange(!checked);
  return (
    <label
      onClick={flip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flip();
        }
      }}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
    >
      <span
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          border: "1px solid rgba(31,41,55,0.12)",
          background: checked ? "rgba(34,197,94,0.20)" : "rgba(148,163,184,0.25)",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 22 : 3,
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "#fff",
            border: "1px solid rgba(31,41,55,0.10)",
            transition: "left 180ms ease",
          }}
        />
      </span>
      <span style={{ fontWeight: 900, opacity: 0.85 }}>{label}</span>
    </label>
  );
}

export default function SeoDrawer({
  open,
  onClose,
  cityId,
  pageKey,
  lang = "ua",
}: {
  open: boolean;
  onClose: () => void;
  cityId: string;
  pageKey: string;
  lang?: SeoLang;
}) {
  const { getEntry, upsert } = useSeo();
  const existing = getEntry(cityId, pageKey);
  const base = useMemo(() => existing ?? { ...makeEmptyEntry(cityId, pageKey), updatedAt: Date.now() }, [existing, cityId, pageKey]);

  const [tab, setTab] = useState<SeoLang>(lang);

  const [ua, setUa] = useState(base.ua);
  const [ru, setRu] = useState(base.ru);

  // Keep local state in sync when switching pageKey/cityId
  React.useEffect(() => {
    setUa(base.ua);
    setRu(base.ru);
  }, [base.ua, base.ru]);

  const active = tab === "ua" ? ua : ru;
  const setActive = (patch: Partial<typeof active>) => {
    if (tab === "ua") setUa((p) => ({ ...p, ...patch }));
    else setRu((p) => ({ ...p, ...patch }));
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(17,24,39,0.35)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 460,
          maxWidth: "92vw",
          background: "#f6f0e8",
          borderLeft: "1px solid rgba(31,41,55,0.12)",
          boxShadow: "-18px 0 40px rgba(17,24,39,0.22)",
          padding: 16,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 950, letterSpacing: "-0.02em", fontSize: 18 }}>SEO налаштування</div>
            <div style={{ opacity: 0.68, fontWeight: 800, fontSize: 12 }}>
              {cityId} • {pageKey}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              border: "1px solid rgba(31,41,55,0.12)",
              background: "rgba(255,255,255,0.74)",
              cursor: "pointer",
              fontWeight: 950,
            }}
            aria-label="Закрити"
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setTab("ua")}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: tab === "ua" ? "1px solid rgba(230,162,74,0.70)" : "1px solid rgba(31,41,55,0.12)",
              background: tab === "ua" ? "rgba(230,162,74,0.18)" : "rgba(255,255,255,0.70)",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            UA
          </button>
          <button
            type="button"
            onClick={() => setTab("ru")}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: tab === "ru" ? "1px solid rgba(230,162,74,0.70)" : "1px solid rgba(31,41,55,0.12)",
              background: tab === "ru" ? "rgba(230,162,74,0.18)" : "rgba(255,255,255,0.70)",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            RU
          </button>
        </div>

        <div style={{ overflow: "auto", paddingRight: 6, display: "grid", gap: 14 }}>
          <Field label="Meta Title">
            <Input value={active.metaTitle} onChange={(e) => setActive({ metaTitle: e.target.value })} placeholder="Напр. Доставка їжі у Києві" />
          </Field>

          <Field label="Meta Description">
            <Textarea rows={3} value={active.metaDescription} onChange={(e) => setActive({ metaDescription: e.target.value })} placeholder="Короткий опис сторінки..." />
          </Field>

          <Field label="Meta Keywords">
            <Input value={active.metaKeywords} onChange={(e) => setActive({ metaKeywords: e.target.value })} placeholder="Ключові слова через кому" />
          </Field>

          <Field label="OpenGraph Title">
            <Input value={active.ogTitle} onChange={(e) => setActive({ ogTitle: e.target.value })} placeholder="Як для соцмереж" />
          </Field>

          <Field label="OpenGraph Description">
            <Textarea rows={2} value={active.ogDescription} onChange={(e) => setActive({ ogDescription: e.target.value })} placeholder="Опис для соцмереж" />
          </Field>

          <Field label="OpenGraph Image URL">
            <Input value={active.ogImage} onChange={(e) => setActive({ ogImage: e.target.value })} placeholder="https://..." />
          </Field>

          <Field label="Canonical URL">
            <Input value={active.canonical} onChange={(e) => setActive({ canonical: e.target.value })} placeholder="https://..." />
          </Field>

          <div style={{ display: "grid", gap: 10 }}>
            <Toggle checked={active.robotsIndex} onChange={(v) => setActive({ robotsIndex: v })} label="Robots: index" />
            <Toggle checked={active.robotsFollow} onChange={(v) => setActive({ robotsFollow: v })} label="Robots: follow" />
          </div>

          <Field label="Текст внизу сторінки">
            <Textarea rows={6} value={active.bottomText} onChange={(e) => setActive({ bottomText: e.target.value })} placeholder="SEO-текст, який буде внизу сторінки..." />
          </Field>

          <div style={{ display: "grid", gap: 12 }}>
            <Toggle
              checked={active.bottomCode?.enabled ?? false}
              onChange={(v) => setActive({ bottomCode: { ...(active.bottomCode || { enabled: false, html: "", css: "", js: "" }), enabled: v } })}
              label="Використовувати код (HTML/CSS/JS) замість звичайного тексту"
            />

            {(active.bottomCode?.enabled ?? false) && (
              <div style={{ display: "grid", gap: 14 }}>
                <Field label="HTML">
                  <Textarea
                    rows={6}
                    value={active.bottomCode?.html ?? ""}
                    onChange={(e) => setActive({ bottomCode: { ...(active.bottomCode || { enabled: true, html: "", css: "", js: "" }), html: e.target.value } })}
                    placeholder="<h2>Заголовок</h2>\n<p>SEO-текст з розміткою...</p>"
                  />
                </Field>

                <Field label="CSS">
                  <Textarea
                    rows={5}
                    value={active.bottomCode?.css ?? ""}
                    onChange={(e) => setActive({ bottomCode: { ...(active.bottomCode || { enabled: true, html: "", css: "", js: "" }), css: e.target.value } })}
                    placeholder=".seo-block { max-width: 900px; margin: 0 auto; }"
                  />
                </Field>

                <Field label="JS">
                  <Textarea
                    rows={5}
                    value={active.bottomCode?.js ?? ""}
                    onChange={(e) => setActive({ bottomCode: { ...(active.bottomCode || { enabled: true, html: "", css: "", js: "" }), js: e.target.value } })}
                    placeholder="console.log('seo');"
                  />
                </Field>

                <div
                  style={{
                    border: "1px dashed rgba(31,41,55,0.18)",
                    borderRadius: 14,
                    padding: 12,
                    background: "rgba(255,255,255,0.45)",
                    color: "rgba(31,41,55,0.65)",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  Код виконується в ізольованому iframe (щоб не ламати сторінку). Якщо потрібна стилізація — роби її в CSS полі вище.
                </div>
              </div>
            )}
          </div>

<div style={{ borderTop: "1px solid rgba(31,41,55,0.10)", paddingTop: 14, display: "grid", gap: 12 }}>
  <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
    Стиль текстового блоку
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
    <Field label="Розмір (px)">
      <Input
        type="number"
        min={10}
        max={28}
        value={active.bottomTextStyle.fontSize}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, fontSize: Number(e.target.value || 14) } })}
      />
    </Field>

    <Field label="Вага">
      <Input
        type="number"
        min={300}
        max={950}
        step={50}
        value={active.bottomTextStyle.fontWeight}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, fontWeight: Number(e.target.value || 700) } })}
      />
    </Field>

    <Field label="Шрифт">
      <select
        value={active.bottomTextStyle.fontFamily}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, fontFamily: e.target.value as any } })}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(31,41,55,0.12)",
          background: "rgba(255,255,255,0.78)",
          outline: "none",
          fontWeight: 800,
        }}
      >
        <option value="sans">Sans</option>
        <option value="serif">Serif</option>
        <option value="mono">Mono</option>
      </select>
    </Field>

    <Field label="Вирівнювання">
      <select
        value={active.bottomTextStyle.align}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, align: e.target.value as any } })}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(31,41,55,0.12)",
          background: "rgba(255,255,255,0.78)",
          outline: "none",
          fontWeight: 800,
        }}
      >
        <option value="left">Ліворуч</option>
        <option value="center">По центру</option>
        <option value="right">Праворуч</option>
      </select>
    </Field>

    <Field label="Колір тексту">
      <Input
        value={active.bottomTextStyle.color}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, color: e.target.value } })}
        placeholder="rgba(...) або #..."
      />
    </Field>

    <Field label="Фон (optional)">
      <Input
        value={active.bottomTextStyle.background}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, background: e.target.value } })}
        placeholder='transparent або #...'
      />
    </Field>

    <Field label="Line-height">
      <Input
        type="number"
        step={0.1}
        min={1.1}
        max={2.2}
        value={active.bottomTextStyle.lineHeight}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, lineHeight: Number(e.target.value || 1.6) } })}
      />
    </Field>

    <Field label="Max width (px)">
      <Input
        type="number"
        min={600}
        max={1600}
        value={active.bottomTextStyle.maxWidth}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, maxWidth: Number(e.target.value || 1200) } })}
      />
    </Field>

    <Field label="Padding X (px)">
      <Input
        type="number"
        min={0}
        max={60}
        value={active.bottomTextStyle.paddingX}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, paddingX: Number(e.target.value || 22) } })}
      />
    </Field>

    <Field label="Padding Y (px)">
      <Input
        type="number"
        min={0}
        max={60}
        value={active.bottomTextStyle.paddingY}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, paddingY: Number(e.target.value || 18) } })}
      />
    </Field>

    <Field label="Радіус (px)">
      <Input
        type="number"
        min={0}
        max={28}
        value={active.bottomTextStyle.borderRadius}
        onChange={(e) => setActive({ bottomTextStyle: { ...active.bottomTextStyle, borderRadius: Number(e.target.value || 0) } })}
      />
    </Field>
  </div>

  <div
    style={{
      border: "1px dashed rgba(31,41,55,0.18)",
      borderRadius: 14,
      padding: 12,
      background: "rgba(255,255,255,0.45)",
      color: "rgba(31,41,55,0.65)",
      fontWeight: 800,
      fontSize: 12,
    }}
  >
    Превʼю внизу сторінки оновлюється одразу після “Зберегти”.
  </div>
</div>

        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => {
              clearSeoMode();
              onClose();
              // reload without query params
              if (typeof window !== "undefined") window.location.href = window.location.pathname + window.location.search.replace(/([?&])seo=1(&|$)/, (m, a, b) => (a === "?" ? "?" : ""))
                .replace(/\?$/, "");
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 999,
              border: "1px solid rgba(31,41,55,0.12)",
              background: "rgba(255,255,255,0.70)",
              color: "#111827",
              fontWeight: 950,
              cursor: "pointer",
              opacity: 0.9,
            }}
          >
            Вийти з SEO режиму
          </button>

          <button
            type="button"
            onClick={() => {
              upsert({ cityId, pageKey, ua, ru });
              onClose();
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 999,
              border: "1px solid rgba(230,162,74,0.70)",
              background: "#e6a24a",
              color: "#fff",
              fontWeight: 950,
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(230,162,74,0.25)",
            }}
          >
            Зберегти
          </button>

          <button
            type="button"
            onClick={() => {
              setUa((p) => ({ ...p, metaTitle: "", metaDescription: "", metaKeywords: "", ogTitle: "", ogDescription: "", ogImage: "", canonical: "", bottomText: "", bottomTextStyle: { ...p.bottomTextStyle }, bottomCode: { enabled: false, html: "", css: "", js: "" } }));
              setRu((p) => ({ ...p, metaTitle: "", metaDescription: "", metaKeywords: "", ogTitle: "", ogDescription: "", ogImage: "", canonical: "", bottomText: "", bottomTextStyle: { ...p.bottomTextStyle }, bottomCode: { enabled: false, html: "", css: "", js: "" } }));
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 999,
              border: "1px solid rgba(31,41,55,0.12)",
              background: "rgba(255,255,255,0.70)",
              color: "#111827",
              fontWeight: 950,
              cursor: "pointer",
              opacity: 0.9,
            }}
          >
            Очистити
          </button>
        </div>
      </div>
    </div>
  );
}
