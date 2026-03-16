import type { Metadata } from "next";
import SiteVenues from "@/features/site/SiteVenues";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({
  params,
}: {
  params: { lang: SiteLang; filters?: string[] };
}): Promise<Metadata> {
  const { lang } = params;
  const suffix = (params.filters || []).join("/");
  const pathname = suffix ? `/${lang}/venues/${suffix}` : `/${lang}/venues`;

  return buildPageMetadata({
    lang,
    pageKey: "venues",
    pathname,
    searchParams: {},
    defaults: { title: "Заклади — mozi", description: "" },
  });
}

export default function Page() {
  return <SiteVenues />;
}

