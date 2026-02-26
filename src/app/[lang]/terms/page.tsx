import type { Metadata } from "next";
import SiteManagedPage from "@/features/site/SiteManagedPage";
import { buildPageMetadata, getGlobalSettings } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

export async function generateMetadata({ params }: { params: { lang: SiteLang } }): Promise<Metadata> {
  const lang = params.lang;
  const global = await getGlobalSettings();
  const brandName = String(global?.brandName || "mozi");

  return buildPageMetadata({
    lang,
    pageKey: "terms",
    pathname: `/${lang}/terms`,
    defaults: { title: "Угода — " + brandName, description: "" },
  });
}

export default function Page() {
  return <SiteManagedPage slug="terms" titleKey="terms" />;
}
