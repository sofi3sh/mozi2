import type { Metadata } from "next";
import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteManagedPage from "@/features/site/SiteManagedPage";
import { buildPageMetadata, getGlobalSettings } from "@/lib/seo/serverMetadata";

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;

  const global = await getGlobalSettings();
  const brandName = String(global?.brandName || "mozi");
  const pages = Array.isArray(global?.pages) ? global.pages : [];
  const page = pages.find((p: any) => String(p?.slug || "") === slug) || null;

  const titleBase =
    (page?.title?.ua as string) ||
    (page?.title?.ru as string) ||
    slug;

  const contentRaw = String(page?.content?.ua || page?.content?.ru || "");
  const description = contentRaw ? stripHtml(contentRaw).slice(0, 180) : "";

  return buildPageMetadata({
    pageKey: slug,
    pathname: `/p/${encodeURIComponent(slug)}`,
    defaults: { title: `${titleBase} — ${brandName}`, description },
  });
}

export default function Page({ params }: { params: { slug: string } }) {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteManagedPage slug={params.slug} />
      </SiteShell>
    </SiteProviders>
  );
}
