import type { Metadata } from "next";
import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteVenues from "@/features/site/SiteVenues";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  return buildPageMetadata({
    pageKey: "venues",
    pathname: "/venues",
    searchParams,
    defaults: { title: "Заклади — mozi", description: "" },
  });
}

export default function VenuesPage() {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteVenues />
      </SiteShell>
    </SiteProviders>
  );
}
