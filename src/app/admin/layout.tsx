import type { Metadata } from "next";
import AdminProviders from "@/components/providers/AdminProviders";
import AdminShell from "@/components/layout/AdminShell";

// Admin pages should not be statically pre-rendered during build.
// They depend on client-side providers (session/settings) and are not SEO targets.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Адмінка",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
