import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteCart from "@/features/site/SiteCart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кошик",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteCart />
      </SiteShell>
    </SiteProviders>
  );
}
