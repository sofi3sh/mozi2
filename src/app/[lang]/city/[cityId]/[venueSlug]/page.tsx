import type { Metadata } from "next";
import { Suspense } from "react";
import SiteVenueMenu from "@/features/site/SiteVenueMenu";
import { buildPageMetadata } from "@/lib/seo/serverMetadata";
import { prisma } from "@/lib/prisma";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({
  params,
}: {
  params: { lang: SiteLang; cityId: string; venueSlug: string };
}): Promise<Metadata> {
  const { lang, cityId, venueSlug } = params;

  const venue = await prisma.venue.findUnique({
    where: { cityId_slug: { cityId, slug: venueSlug } },
    select: { name: true, description: true },
  });

  const title = venue?.name ? `${venue.name} — Меню` : "Меню — mozi";
  const description = (venue?.description || "").toString();

  return buildPageMetadata({
    lang,
    cityId,
    pageKey: `venue:${venueSlug}`,
    pathname: `/${lang}/city/${encodeURIComponent(cityId)}/${encodeURIComponent(venueSlug)}`,
    defaults: { title, description },
  });
}

export default function Page({ params }: { params: { lang: SiteLang; cityId: string; venueSlug: string } }) {
  return (
    <Suspense fallback={null}>
      <SiteVenueMenu cityId={params.cityId} venueSlug={params.venueSlug} />
    </Suspense>
  );
}
