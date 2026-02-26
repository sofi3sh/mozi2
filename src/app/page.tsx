import type { Metadata } from "next";
import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteHome from "@/features/site/SiteHome";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  return buildPageMetadata({
    pageKey: "home",
    pathname: "/",
    searchParams,
    defaults: { title: "mozi — доставка їжі", description: "" },
  });
}

export default function HomePage() {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteHome />
      </SiteShell>
    </SiteProviders>
  );
}
