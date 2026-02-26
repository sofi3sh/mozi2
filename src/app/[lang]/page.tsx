import type { Metadata } from "next";
import SiteHome from "@/features/site/SiteHome";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { lang: SiteLang };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const lang = params.lang;
  return buildPageMetadata({
    lang,
    pageKey: "home",
    pathname: `/${lang}`,
    searchParams,
    defaults: { title: "mozi — доставка їжі", description: "" },
  });
}

export default function Page() {
  return <SiteHome />;
}
