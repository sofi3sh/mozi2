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
    pageKey: "about",
    pathname: `/${lang}/about`,
    defaults: { title: "Про нас — " + brandName, description: "" },
  });
}

export default function Page() {
  return <SiteManagedPage slug="about" titleKey="about" />;
}
