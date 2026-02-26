import MenuVenueDishesPage from "@/features/menu/MenuVenueDishesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <MenuVenueDishesPage cityId={cityId} venueId={venueId} />;
}
