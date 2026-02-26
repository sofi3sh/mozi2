import { Suspense } from "react";
import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteProviders>
      <Suspense fallback={null}>
        <SiteShell>{children}</SiteShell>
      </Suspense>
    </SiteProviders>
  );
}
