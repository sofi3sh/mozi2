import MenuDishesPage from "@/features/menu/MenuDishesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <MenuDishesPage cityId={cityId} venueId={venueId} />;
}
