import type { Metadata } from "next";
import SiteCheckout from "@/features/site/SiteCheckout";

export const metadata: Metadata = {
  title: "Оформлення",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SiteCheckout />;
}
