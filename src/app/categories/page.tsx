import type { Metadata } from "next";
import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteCategories from "@/features/site/SiteCategories";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  return buildPageMetadata({
    pageKey: "categories",
    pathname: "/categories",
    searchParams,
    defaults: { title: "Категорії — mozi", description: "" },
  });
}

export default function CategoriesPage() {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteCategories />
      </SiteShell>
    </SiteProviders>
  );
}
