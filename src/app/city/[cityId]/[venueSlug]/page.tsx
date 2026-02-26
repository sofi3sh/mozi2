import type { Metadata } from "next";
import { Suspense } from "react";
import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteVenueMenu from "@/features/site/SiteVenueMenu";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: { cityId: string; venueSlug: string };
}): Promise<Metadata> {
  const cityId = params.cityId;
  const venueSlug = params.venueSlug;

  const venue = await prisma.venue.findUnique({
    where: { cityId_slug: { cityId, slug: venueSlug } },
    select: { name: true, description: true },
  });

  const title = venue?.name ? `${venue.name} — Меню` : "Меню — mozi";
  const description = (venue?.description || "").toString();

  return buildPageMetadata({
    cityId,
    pageKey: `venue:${venueSlug}`,
    pathname: `/city/${encodeURIComponent(cityId)}/${encodeURIComponent(venueSlug)}`,
    defaults: { title, description },
  });
}

export default function VenueMenuPage({ params }: { params: { cityId: string; venueSlug: string } }) {
  return (
    <SiteProviders>
      <Suspense fallback={null}>
        <SiteShell>
          <SiteVenueMenu cityId={params.cityId} venueSlug={params.venueSlug} />
        </SiteShell>
      </Suspense>
    </SiteProviders>
  );
}
