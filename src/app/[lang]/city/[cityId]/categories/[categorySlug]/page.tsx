import type { Metadata } from "next";
import SiteCategoryType from "@/features/site/SiteCategoryType";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { lang: SiteLang; cityId: string; categorySlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const { lang, cityId, categorySlug } = params;
  return buildPageMetadata({
    lang,
    cityId,
    pageKey: `category:${categorySlug}`,
    pathname: `/${lang}/city/${encodeURIComponent(cityId)}/categories/${categorySlug}`,
    searchParams,
    defaults: {
      title: `Категорія — ${categorySlug}`,
      description: "",
    },
  });
}

export default function Page({
  params,
}: {
  params: { lang: SiteLang; cityId: string; categorySlug: string };
}) {
  return <SiteCategoryType categorySlug={params.categorySlug} initialCityId={params.cityId} />;
}

