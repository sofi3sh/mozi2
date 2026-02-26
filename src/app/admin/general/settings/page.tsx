"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/Page";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";
import { useSettings, type SubdomainsSettings } from "@/store/settings";
import { useSession } from "@/store/session";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export default function GeneralSettingsPage() {
  const { global, updateGlobal } = useSettings();
  const { user } = useSession();

  const [draft, setDraft] = useState<SubdomainsSettings>(() => clone(global.subdomains));

  // Account settings
  const [profileName, setProfileName] = useState<string>(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState<string>(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // 2FA
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaPending, setTwoFaPending] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [twoFaUri, setTwoFaUri] = useState<string | null>(null);
  const [twoFaOtp, setTwoFaOtp] = useState("");
  const [twoFaMsg, setTwoFaMsg] = useState<string | null>(null);
  const [twoFaErr, setTwoFaErr] = useState<string | null>(null);
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  useEffect(() => {
    setDraft(clone(global.subdomains));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global.subdomains]);

  useEffect(() => {
    setProfileName(user?.name ?? "");
    setProfileEmail(user?.email ?? "");
  }, [user?.name, user?.email]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/security/2fa", { cache: "no-store" });
        const data = (await res.json()) as any;
        setTwoFaEnabled(Boolean(data?.enabled));
        setTwoFaPending(Boolean(data?.pending));
      } catch {
        // ignore
      }
    })();
  }, []);

  const reservedLines = useMemo(() => (draft.reserved ?? []).join("\n"), [draft.reserved]);

  function setField(patch: Partial<SubdomainsSettings>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function setReservedFromText(s: string) {
    const arr = s
      .split("\n")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    // unique
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const x of arr) {
      if (seen.has(x)) continue;
      seen.add(x);
      unique.push(x);
    }

    setField({ reserved: unique });
  }

  function save() {
    const next: SubdomainsSettings = {
      enabled: !!draft.enabled,
      rootDomain: (draft.rootDomain ?? "").toString().trim().replace(/^https?:\/\//, "").replace(/\/.*/, "").replace(/^\./, ""),
      reserved: Array.isArray(draft.reserved) ? draft.reserved : [],
    };

    updateGlobal({ subdomains: next });
  }

  async function saveProfile() {
    setProfileMsg(null);
    setProfileErr(null);
    setProfileSaving(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        setProfileErr(data?.error ?? "Не вдалося зберегти");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setProfileMsg("Збережено");
    } catch {
      setProfileErr("Не вдалося зберегти");
    } finally {
      setProfileSaving(false);
    }
  }

  async function startTwoFa() {
    setTwoFaMsg(null);
    setTwoFaErr(null);
    setTwoFaBusy(true);
    try {
      const res = await fetch("/api/security/2fa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        setTwoFaErr(data?.error ?? "Не вдалося налаштувати");
        return;
      }
      setTwoFaSecret(String(data.secret || ""));
      setTwoFaUri(String(data.otpauthUri || ""));
      setTwoFaPending(true);
      setTwoFaMsg("Скануйте QR/URI або введіть secret вручну, потім підтвердьте код.");
    } catch {
      setTwoFaErr("Не вдалося налаштувати");
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function verifyTwoFa() {
    setTwoFaMsg(null);
    setTwoFaErr(null);
    setTwoFaBusy(true);
    try {
      const res = await fetch("/api/security/2fa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "verify", otp: twoFaOtp }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        setTwoFaErr(data?.error ?? "Невірний код");
        return;
      }
      setTwoFaEnabled(true);
      setTwoFaPending(false);
      setTwoFaSecret(null);
      setTwoFaUri(null);
      setTwoFaOtp("");
      setTwoFaMsg("2FA увімкнено");
    } catch {
      setTwoFaErr("Не вдалося підтвердити");
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function disableTwoFa() {
    setTwoFaMsg(null);
    setTwoFaErr(null);
    setTwoFaBusy(true);
    try {
      const res = await fetch("/api/security/2fa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "disable", otp: twoFaOtp }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        setTwoFaErr(data?.error ?? "Невірний код");
        return;
      }
      setTwoFaEnabled(false);
      setTwoFaPending(false);
      setTwoFaSecret(null);
      setTwoFaUri(null);
      setTwoFaOtp("");
      setTwoFaMsg("2FA вимкнено");
    } catch {
      setTwoFaErr("Не вдалося вимкнути");
    } finally {
      setTwoFaBusy(false);
    }
  }

  return (
    <div className="ui-grid">
      <PageHeader
        title="Загальні налаштування"
        description={
          <>
            Тут — налаштування, які застосовуються до <b>всіх міст</b>.
          </>
        }
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <SecondaryButton type="button" onClick={() => setDraft(clone(global.subdomains))}>
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
          title="Піддомени міст"
          subtitle="Коли увімкнено — slug міста використовується як піддомен (lviv.example.com)."
        />

        <div className="ui-grid" style={{ gap: 14 }}>
          <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
            <label className="ui-checkRow" style={{ marginBottom: 10 }}>
              <input type="checkbox" checked={!!draft.enabled} onChange={(e) => setField({ enabled: e.target.checked })} />
              Увімкнути піддомени
            </label>

            <div className="ui-field">
              <div className="ui-label">Кореневий домен</div>
              <Input
                value={draft.rootDomain ?? ""}
                onChange={(e) => setField({ rootDomain: e.target.value })}
                placeholder="mozi.ua"
              />
              <div className="ui-subtitle" style={{ marginTop: 6 }}>
                Приклад: <b>lviv.{(draft.rootDomain ?? "mozi.ua").toString().trim() || "mozi.ua"}</b>
              </div>
            </div>

            <div className="ui-field" style={{ marginTop: 12 }}>
              <div className="ui-label">Зарезервовані піддомени (по одному на рядок)</div>
              <Textarea
                value={reservedLines}
                onChange={(e) => setReservedFromText(e.target.value)}
                rows={4}
                placeholder="www\nadmin\napi"
              />
              <div className="ui-subtitle" style={{ marginTop: 6 }}>
                Ці значення не будуть трактуватися як місто.
              </div>
            </div>
          </div>

          <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
            <div style={{ fontWeight: 950 }}>Як це працює</div>
            <div className="ui-subtitle" style={{ marginTop: 8, lineHeight: 1.6 }}>
              <div>
                1) Ви вмикаєте режим піддоменів та задаєте кореневий домен.
              </div>
              <div>
                2) Для кожного міста slug (ID) стає піддоменом.
              </div>
              <div>
                3) На сайті вибір міста фіксується піддоменом.
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Акаунт" subtitle="Зміна імені, email (логіна) та пароля для поточного користувача." />
        <div className="ui-grid">
          <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950 }}>Поточний користувач</div>
              <Badge>{user?.role ?? "guest"}</Badge>
            </div>

            <div className="ui-grid" style={{ marginTop: 12, gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Імʼя</div>
                <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Власник" />
              </div>
              <div className="ui-field">
                <div className="ui-label">Email (логін)</div>
                <Input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="name@gmail.com" />
              </div>
            </div>

            <div className="ui-grid" style={{ marginTop: 12, gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="ui-field">
                <div className="ui-label">Поточний пароль</div>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                <div className="ui-subtitle" style={{ marginTop: 6 }}>
                  Потрібен лише якщо змінюєте email або пароль.
                </div>
              </div>
              <div className="ui-field">
                <div className="ui-label">Новий пароль</div>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            {profileErr ? <div className="ui-subtitle" style={{ color: "rgba(239,68,68,0.95)", fontWeight: 900, marginTop: 10 }}>{profileErr}</div> : null}
            {profileMsg ? <div className="ui-subtitle" style={{ color: "rgba(34,197,94,0.95)", fontWeight: 900, marginTop: 10 }}>{profileMsg}</div> : null}

            <div className="ui-actions" style={{ marginTop: 12 }}>
              <Button type="button" onClick={saveProfile} disabled={profileSaving || !profileName.trim() || !profileEmail.trim()}>
                {profileSaving ? "Збереження…" : "Зберегти"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="2FA (двохфакторна автентифікація)" subtitle="Додатковий захист входу для Owner." />

        <div className="ui-grid">
          {user?.role !== "owner" ? (
            <div className="ui-subtitle">2FA доступна лише для ролі <b>owner</b>.</div>
          ) : (
            <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 950 }}>Статус</div>
                <Badge variant={twoFaEnabled ? "ok" : twoFaPending ? "default" : "stop"}>
                  {twoFaEnabled ? "Увімкнено" : twoFaPending ? "Очікує підтвердження" : "Вимкнено"}
                </Badge>
              </div>

              {!twoFaEnabled ? (
                <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                  <div className="ui-subtitle" style={{ lineHeight: 1.6 }}>
                    Увімкніть 2FA, щоб під час входу додатково вимагався 6-значний код з Authenticator.
                  </div>

                  {!twoFaPending ? (
                    <div className="ui-actions">
                      <Button type="button" onClick={startTwoFa} disabled={twoFaBusy}>
                        {twoFaBusy ? "Підготовка…" : "Увімкнути 2FA"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="ui-field">
                        <div className="ui-label">Secret (manual)</div>
                        <Input value={twoFaSecret ?? ""} readOnly />
                      </div>
                      <div className="ui-field">
                        <div className="ui-label">otpauth URI</div>
                        <Textarea value={twoFaUri ?? ""} readOnly rows={3} />
                        <div className="ui-subtitle" style={{ marginTop: 6 }}>
                          Можна вставити URI у генератор QR (або додати обліковий запис вручну в Authenticator).
                        </div>
                      </div>
                      <div className="ui-field">
                        <div className="ui-label">Код з Authenticator</div>
                        <Input value={twoFaOtp} onChange={(e) => setTwoFaOtp(e.target.value)} placeholder="123456" inputMode="numeric" />
                      </div>
                      <div className="ui-actions">
                        <SecondaryButton type="button" onClick={() => { setTwoFaPending(false); setTwoFaSecret(null); setTwoFaUri(null); setTwoFaOtp(""); }} disabled={twoFaBusy}>
                          Скасувати
                        </SecondaryButton>
                        <Button type="button" onClick={verifyTwoFa} disabled={twoFaBusy || twoFaOtp.trim().length < 6}>
                          {twoFaBusy ? "Перевірка…" : "Підтвердити"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                  <div className="ui-subtitle" style={{ lineHeight: 1.6 }}>
                    Для вимкнення 2FA введіть поточний код з Authenticator.
                  </div>
                  <div className="ui-field">
                    <div className="ui-label">Код 2FA</div>
                    <Input value={twoFaOtp} onChange={(e) => setTwoFaOtp(e.target.value)} placeholder="123456" inputMode="numeric" />
                  </div>
                  <div className="ui-actions">
                    <SecondaryButton type="button" onClick={disableTwoFa} disabled={twoFaBusy || twoFaOtp.trim().length < 6} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
                      {twoFaBusy ? "Вимкнення…" : "Вимкнути 2FA"}
                    </SecondaryButton>
                  </div>
                </div>
              )}

              {twoFaErr ? <div className="ui-subtitle" style={{ color: "rgba(239,68,68,0.95)", fontWeight: 900, marginTop: 10 }}>{twoFaErr}</div> : null}
              {twoFaMsg ? <div className="ui-subtitle" style={{ color: "rgba(34,197,94,0.95)", fontWeight: 900, marginTop: 10 }}>{twoFaMsg}</div> : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
