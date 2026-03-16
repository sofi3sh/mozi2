import type { Metadata } from "next";
import SiteVenues from "@/features/site/SiteVenues";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { lang: SiteLang; filters?: string[] };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const { lang, filters } = params;

  let cityId: string | undefined;
  const firstSegment = Array.isArray(filters) && filters.length ? filters[0] || "" : "";
  if (firstSegment.startsWith("city-")) {
    cityId = firstSegment.slice("city-".length);
  }

  return buildPageMetadata({
    lang,
    cityId,
    pageKey: "venues",
    pathname: `/${lang}/venues`,
    searchParams,
    defaults: { title: "Заклади — mozi", description: "" },
  });
}

export default function Page() {
  return <SiteVenues />;
}

