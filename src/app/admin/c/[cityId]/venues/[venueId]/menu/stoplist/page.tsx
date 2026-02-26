import MenuStopListPage from "@/features/menu/MenuStopListPage";

export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  // Avoid redirects: render stop-list directly.
  return <MenuStopListPage cityId={cityId} venueId={venueId} />;
}
