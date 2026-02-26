import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вхід",
  robots: { index: false, follow: false },
};

export default function AuthLoginPage() {
  return (
    <main style={{ maxWidth: 820, margin: "80px auto", padding: 18 }}>
      <h1 style={{ fontSize: 24, fontWeight: 950, letterSpacing: "-0.02em" }}>Вхід</h1>
      <p style={{ marginTop: 10, lineHeight: 1.7, opacity: 0.85, fontWeight: 650 }}>
        Ця сторінка залишена для сумісності, але вхід до адмін-панелі знаходиться тут: {" "}
        <Link href="/login" style={{ textDecoration: "underline" }}>
          /login
        </Link>
      </p>
    </main>
  );
}
