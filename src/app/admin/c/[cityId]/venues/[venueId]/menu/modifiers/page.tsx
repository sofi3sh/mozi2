import MenuModifiersPage from "@/features/menu/MenuModifiersPage";

export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  // Avoid redirects: render the tab content directly.
  // (Previously redirected to ingredients; modifiers has its own page.)
  return <MenuModifiersPage cityId={cityId} venueId={venueId} />;
}
