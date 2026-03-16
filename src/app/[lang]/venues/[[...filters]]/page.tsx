import type { Metadata } from "next";
import SiteVenues from "@/features/site/SiteVenues";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({
  params,
}: {
  params: { lang: SiteLang; filters?: string[] };
}): Promise<Metadata> {
  const lang = params.lang;
  const filters = params.filters || [];
  const suffix = filters.length ? `/${filters.join("/")}` : "";

  return buildPageMetadata({
    lang,
    pageKey: "venues",
    pathname: `/${lang}/venues${suffix}`,
    searchParams: {},
    defaults: { title: "Заклади — mozi", description: "" },
  });
}

export default function Page() {
  return <SiteVenues />;
}

