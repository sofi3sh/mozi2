"use client";

import React from "react";
import Link from "next/link";

export default function UnauthorizedView({
  reason,
  backHref = "/admin",
}: {
  reason?: "not-auth" | "no-permissions" | "nav" | "city" | string;
  backHref?: string;
}) {
  const title = "Немає доступу";
  const subtitle =
    reason === "city"
      ? "Ваш акаунт не має доступу до цього міста."
      : reason === "no-permissions"
      ? "Для вашої ролі не увімкнено жодних розділів."
      : "Ваша роль не має прав на цей розділ.";

  return (
    <div className="ui-card" style={{ maxWidth: 720, margin: "40px auto", padding: 22 }}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 22, letterSpacing: "-0.02em" }}>{title}</div>
        <div className="ui-subtitle" style={{ lineHeight: 1.6 }}>
          {subtitle}
        </div>

        <div
          className="ui-card ui-card--soft"
          style={{ padding: 14, background: "var(--panel-2)", border: "1px solid var(--border)" }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Що робити</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", lineHeight: 1.7, fontSize: 14 }}>
            <li>Зверніться до власника/адміна, щоб увімкнути права для вашої ролі.</li>
            <li>Якщо це місто — попросіть додати вам доступ до міста у “Користувачі”.</li>
          </ul>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
          <Link className="ui-btn" href={backHref}>
            Повернутись в адмінку
          </Link>
          <button
            className="ui-btn ui-btn--ghost"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } finally {
                window.location.href = "/login";
              }
            }}
            type="button"
          >
            Вийти
          </button>
        </div>
      </div>
    </div>
  );
}
