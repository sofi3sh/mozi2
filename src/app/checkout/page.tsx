import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteCheckout from "@/features/site/SiteCheckout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteCheckout />
      </SiteShell>
    </SiteProviders>
  );
}
