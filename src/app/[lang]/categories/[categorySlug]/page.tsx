import type { Metadata } from "next";
import SiteCategoryType from "@/features/site/SiteCategoryType";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { lang: SiteLang; categorySlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const { lang, categorySlug } = params;
  return buildPageMetadata({
    lang,
    pageKey: `category:${categorySlug}`,
    pathname: `/${lang}/categories/${categorySlug}`,
    searchParams,
    defaults: {
      title: `Категорія — ${categorySlug}`,
      description: "",
    },
  });
}

export default function Page({ params }: { params: { categorySlug: string } }) {
  return <SiteCategoryType categorySlug={params.categorySlug} />;
}

