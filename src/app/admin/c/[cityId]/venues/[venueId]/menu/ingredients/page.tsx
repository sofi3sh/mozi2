import MenuIngredientsPage from "@/features/menu/MenuIngredientsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <MenuIngredientsPage cityId={cityId} venueId={venueId} />;
}
