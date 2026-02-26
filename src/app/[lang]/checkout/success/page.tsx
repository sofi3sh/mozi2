import type { Metadata } from "next";
import SiteCheckoutSuccess from "@/features/site/SiteCheckoutSuccess";

export const metadata: Metadata = {
  title: "Замовлення прийнято",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SiteCheckoutSuccess />;
}
