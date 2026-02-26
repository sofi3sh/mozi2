import React from "react";
import { notFound } from "next/navigation";
import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import { isSiteLang, type SiteLang } from "@/lib/lang";

export function generateStaticParams() {
  return [{ lang: "ua" }, { lang: "ru" }];
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang = params.lang as SiteLang;
  if (!isSiteLang(lang)) notFound();

  return (
    <SiteProviders>
      <SiteShell>{children}</SiteShell>
    </SiteProviders>
  );
}
