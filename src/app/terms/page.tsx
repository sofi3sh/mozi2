import SiteProviders from "@/components/providers/SiteProviders";
import SiteShell from "@/components/site/SiteShell";
import SiteManagedPage from "@/features/site/SiteManagedPage";

export default function Page() {
  return (
    <SiteProviders>
      <SiteShell>
        <SiteManagedPage slug="terms" titleKey="terms" />
      </SiteShell>
    </SiteProviders>
  );
}
