"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/Page";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";
import AutoTranslateButtons from "@/components/ui/AutoTranslateButtons";
import { useSettings } from "@/store/settings";

type LangBlock = {
  title: string;
  subtitle: string;
  message: string;
  contactsTitle: string;
  contactsHint: string;
};

type Draft = {
  ua: LangBlock;
  ru: LangBlock;
  phones: string[];
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function normalizePhones(list: string[]) {
  return (list || [])
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

export default function CheckoutSuccessSettingsPage() {
  const { global, updateGlobal } = useSettings();

  const initial = useMemo<Draft>(() => {
    const v: any = (global as any)?.checkoutSuccess;
    const safe: Draft = {
      ua: {
        title: v?.ua?.title ?? "Замовлення оформлено",
        subtitle: v?.ua?.subtitle ?? "Дякуємо за замовлення!",
        message: v?.ua?.message ?? "Наш менеджер зв’яжеться з вами найближчим часом, щоб підтвердити деталі.",
        contactsTitle: v?.ua?.contactsTitle ?? "Є додаткові питання?",
        contactsHint: v?.ua?.contactsHint ?? "Зателефонуйте нам за номером:",
      },
      ru: {
        title: v?.ru?.title ?? "Заказ оформлен",
        subtitle: v?.ru?.subtitle ?? "Спасибо за заказ!",
        message: v?.ru?.message ?? "Наш менеджер свяжется с вами в ближайшее время, чтобы подтвердить детали.",
        contactsTitle: v?.ru?.contactsTitle ?? "Есть вопросы?",
        contactsHint: v?.ru?.contactsHint ?? "Позвоните нам по номеру:",
      },
      phones: normalizePhones(Array.isArray(v?.phones) ? v.phones : []),
    };
    return safe;
  }, [global]);

  const [draft, setDraft] = useState<Draft>(() => clone(initial));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(clone(initial));
  }, [initial]);

  function setLang(lang: "ua" | "ru", patch: Partial<LangBlock>) {
    setDraft((d) => ({ ...d, [lang]: { ...d[lang], ...patch } }));
  }

  function phonesToText(p: string[]) {
    return (p || []).join("\n");
  }

  function phonesFromText(s: string) {
    return normalizePhones(
      s
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
    );
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      updateGlobal({ checkoutSuccess: { ...draft, phones: normalizePhones(draft.phones) } } as any);
      setMsg("Збережено");
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  }

  function applyRuFromUa() {
    const fields: (keyof LangBlock)[] = ["title", "subtitle", "message", "contactsTitle", "contactsHint"];
    (async () => {
      setMsg(null);
      setErr(null);
      try {
        for (const f of fields) {
          const text = String((draft.ua as any)[f] ?? "");
          if (!text.trim()) continue;
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, sourceLang: "ua", targetLang: "ru" }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || "Translate failed");
          const out = String(data?.text || "");
          setLang("ru", { [f]: out } as any);
        }
        setMsg("RU заповнено через DeepL");
      } catch (e: any) {
        setErr(String(e?.message || e));
      }
    })();
  }

  return (
    <div className="ui-grid">
      <PageHeader
        title="Сторінка після оплати"
        description="Налаштуйте тексти та телефони, які показуються клієнту після оформлення/оплати замовлення."
        actions={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={save} disabled={saving}>
              {saving ? "Збереження..." : "Зберегти"}
            </Button>
            <SecondaryButton onClick={() => setDraft(clone(initial))} disabled={saving}>
              Скинути
            </SecondaryButton>
            {msg ? <Badge variant="ok">{msg}</Badge> : null}
            {err ? <Badge variant="stop">{err}</Badge> : null}
          </div>
        }
      />

      <Card>
        <CardHeader title="Телефони для звʼязку" subtitle="Клієнт побачить ці номери на сторінці “Замовлення оформлено”." />
        <div style={{ padding: 14, display: "grid", gap: 10 }}>
          <Textarea
            value={phonesToText(draft.phones)}
            placeholder={"+380 00 000 00 00\n+380 00 000 00 00"}
            onChange={(e) => setDraft((d) => ({ ...d, phones: phonesFromText(e.target.value) }))}
            style={{ minHeight: 110 }}
          />
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            * по 1 номеру на рядок. Формат може бути будь-який — на сайті це буде клікабельний tel:.
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <CardHeader title="UA" subtitle="Тексти українською" />
          <div style={{ padding: 14, display: "grid", gap: 10 }}>
            <Input value={draft.ua.title} onChange={(e) => setLang("ua", { title: e.target.value })} placeholder="Заголовок" />
            <Input value={draft.ua.subtitle} onChange={(e) => setLang("ua", { subtitle: e.target.value })} placeholder="Підзаголовок" />
            <Textarea
              value={draft.ua.message}
              onChange={(e) => setLang("ua", { message: e.target.value })}
              placeholder="Основний текст"
              style={{ minHeight: 90 }}
            />
            <Input value={draft.ua.contactsTitle} onChange={(e) => setLang("ua", { contactsTitle: e.target.value })} placeholder="Заголовок блоку контактів" />
            <Input value={draft.ua.contactsHint} onChange={(e) => setLang("ua", { contactsHint: e.target.value })} placeholder="Підказка перед телефонами" />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="RU"
            subtitle="Тексти російською"
            right={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <SecondaryButton type="button" onClick={applyRuFromUa}>
                  DeepL: UA→RU (все)
                </SecondaryButton>
              </div>
            }
          />
          <div style={{ padding: 14, display: "grid", gap: 10 }}>
            <Input value={draft.ru.title} onChange={(e) => setLang("ru", { title: e.target.value })} placeholder="Заголовок" />
            <AutoTranslateButtons from="ua" to="ru" getText={() => draft.ua.title} setText={(v) => setLang("ru", { title: v })} />

            <Input value={draft.ru.subtitle} onChange={(e) => setLang("ru", { subtitle: e.target.value })} placeholder="Подзаголовок" />
            <AutoTranslateButtons from="ua" to="ru" getText={() => draft.ua.subtitle} setText={(v) => setLang("ru", { subtitle: v })} />

            <Textarea
              value={draft.ru.message}
              onChange={(e) => setLang("ru", { message: e.target.value })}
              placeholder="Основной текст"
              style={{ minHeight: 90 }}
            />
            <AutoTranslateButtons from="ua" to="ru" getText={() => draft.ua.message} setText={(v) => setLang("ru", { message: v })} />

            <Input value={draft.ru.contactsTitle} onChange={(e) => setLang("ru", { contactsTitle: e.target.value })} placeholder="Заголовок блока контактов" />
            <AutoTranslateButtons from="ua" to="ru" getText={() => draft.ua.contactsTitle} setText={(v) => setLang("ru", { contactsTitle: v })} />

            <Input value={draft.ru.contactsHint} onChange={(e) => setLang("ru", { contactsHint: e.target.value })} placeholder="Подсказка перед телефонами" />
            <AutoTranslateButtons from="ua" to="ru" getText={() => draft.ua.contactsHint} setText={(v) => setLang("ru", { contactsHint: v })} />
          </div>
        </Card>
      </div>
    </div>
  );
}
