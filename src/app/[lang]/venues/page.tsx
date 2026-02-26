import type { Metadata } from "next";
import SiteVenues from "@/features/site/SiteVenues";
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
    pageKey: "venues",
    pathname: `/${lang}/venues`,
    searchParams,
    defaults: { title: "Заклади — mozi", description: "" },
  });
}

export default function Page() {
  return <SiteVenues />;
}
