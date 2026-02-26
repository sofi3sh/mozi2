import UnauthorizedView from "@/components/ui/UnauthorizedView";

export const dynamic = "force-dynamic";

export default function UnauthorizedPage() {
  return <UnauthorizedView reason="nav" backHref="/admin" />;
}
