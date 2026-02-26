import type { Metadata } from "next";
import SiteCart from "@/features/site/SiteCart";

export const metadata: Metadata = {
  title: "Кошик",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SiteCart />;
}
