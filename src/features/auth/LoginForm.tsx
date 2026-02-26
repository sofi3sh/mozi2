"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useSession } from "@/store/session";
import { Button, Input } from "@/components/ui/Input";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin/menu";
  const { login } = useSession();

  const [email, setEmail] = useState("owner@mozi.local");
  const [password, setPassword] = useState("demo1234");
  const [otp, setOtp] = useState("");
  const [needOtp, setNeedOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const can = useMemo(() => email.trim().includes("@") && password.length >= 4 && (!needOtp || otp.trim().length >= 6), [email, password, needOtp, otp]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await login(email.trim(), password, needOtp ? otp.trim() : undefined);
        setLoading(false);
        if (!res.ok) {
          if (res.requiresOtp) {
            setNeedOtp(true);
          }
          setError(res.message || "Невірний email або пароль");
          return;
        }
        setNeedOtp(false);
        setOtp("");
        router.push(next);
      }}
      style={{ display: "grid", gap: 12 }}
    >
      <div className="ui-field">
        <div className="ui-label">Email (можна Gmail)</div>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" />
      </div>

      <div className="ui-field">
        <div className="ui-label">Пароль</div>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>

      {needOtp ? (
        <div className="ui-field">
          <div className="ui-label">Код 2FA</div>
          <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" inputMode="numeric" />
          <div className="ui-subtitle" style={{ marginTop: 6 }}>
            Введіть 6-значний код з Authenticator.
          </div>
        </div>
      ) : null}

      {error ? <div className="ui-subtitle" style={{ color: "rgba(239,68,68,0.95)", fontWeight: 800 }}>{error}</div> : null}

      <Button type="submit" disabled={!can || loading}>
        {loading ? "Вхід…" : "Увійти"}
      </Button>

      <div className="ui-subtitle">
        Демо: <b>owner@mozi.local</b> / <b>demo1234</b>
      </div>
    </form>
  );
}
