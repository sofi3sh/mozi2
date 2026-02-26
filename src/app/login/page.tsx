import { Card, CardHeader } from "@/components/ui/Card";
import { SessionProvider } from "@/store/session";
import LoginForm from "@/features/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вхід",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <SessionProvider>
      <div className="theme-auth" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <main
          style={{
            maxWidth: 1080,
            margin: "60px auto",
            padding: 16,
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div style={{ fontWeight: 950, fontSize: 30, letterSpacing: "-0.03em" }}>
              Вітаємо в Адмінці нашого сайту!
            </div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: 14 }}>
              Увійдіть, щоб керувати містами, закладами, меню та налаштуваннями.
            </div>
            <div className="ui-card ui-card--soft" style={{ padding: 16, background: "rgba(255,255,255,0.55)" }}>
              <div style={{ fontWeight: 950 }}>Порада</div>
              <div className="ui-subtitle" style={{ marginTop: 8 }}>
                Після входу відкрийте <b>Міста</b> → оберіть місто → керуйте <b>Меню</b> та <b>Замовленнями</b>.
              </div>
            </div>
          </div>

          <Card>
            <CardHeader title="Вхід" subtitle="Логін (email) + пароль" />
            <LoginForm />
          </Card>
        </main>
      </div>
    </SessionProvider>
  );
}
