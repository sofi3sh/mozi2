import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteCheckoutSuccess from "@/features/site/SiteCheckoutSuccess";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Замовлення оформлено",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteCheckoutSuccess />
      </SiteShell>
    </SiteProviders>
  );
}
