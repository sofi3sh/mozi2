import type { Metadata } from "next";
import SiteCategories from "@/features/site/SiteCategories";
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
    pageKey: "categories",
    pathname: `/${lang}/categories`,
    searchParams,
    defaults: { title: "Категорії — mozi", description: "" },
  });
}

export default function Page() {
  return <SiteCategories />;
}
