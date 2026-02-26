import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { headers } from "next/headers";
import { langFromPathname } from "@/lib/lang";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  // Default public-site metadata. Admin routes override this.
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: {
    default: "Mozi — доставка їжі",
    template: "%s — Mozi",
  },
  description: "Замовляйте доставку їжі у вашому місті швидко та зручно.",
  applicationName: "Mozi",
  openGraph: {
    type: "website",
    siteName: "Mozi",
    locale: "uk_UA",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-mozi-pathname") || "/";
  const l = langFromPathname(pathname, "ua");
  const htmlLang = l === "ru" ? "ru" : "uk";

  // lang is determined from URL prefix (/ua or /ru)
  return (
    <html lang={htmlLang}>
      {/*
        Next.js App Router: якщо всередині дерева рендера є клієнтські компоненти з useSearchParams(),
        під час prerender/SSG потрібно мати Suspense boundary, інакше build падає з
        "useSearchParams() should be wrapped in a suspense boundary".
      */}
      <body className={inter.className}>
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
