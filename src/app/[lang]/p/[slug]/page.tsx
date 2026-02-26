import type { Metadata } from "next";
import SiteManagedPage from "@/features/site/SiteManagedPage";
import { buildPageMetadata, getGlobalSettings } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: { lang: SiteLang; slug: string };
}): Promise<Metadata> {
  const { lang, slug } = params;

  const global = await getGlobalSettings();
  const brandName = String(global?.brandName || "mozi");
  const pages = Array.isArray(global?.pages) ? global.pages : [];
  const page = pages.find((p: any) => String(p?.slug || "") === slug) || null;

  const titleBase = (page?.title?.[lang] as string) || (page?.title?.ua as string) || (page?.title?.ru as string) || slug;

  const contentRaw = String(page?.content?.[lang] || page?.content?.ua || page?.content?.ru || "");
  const description = contentRaw ? stripHtml(contentRaw).slice(0, 180) : "";

  return buildPageMetadata({
    lang,
    pageKey: slug,
    pathname: `/${lang}/p/${encodeURIComponent(slug)}`,
    defaults: { title: `${titleBase} — ${brandName}`, description },
  });
}

export default function Page({ params }: { params: { lang: SiteLang; slug: string } }) {
  return <SiteManagedPage slug={params.slug} />;
}
