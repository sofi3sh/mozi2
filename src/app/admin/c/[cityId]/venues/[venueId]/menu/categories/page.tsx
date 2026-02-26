import MenuCategoriesPage from "@/features/menu/MenuCategoriesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <MenuCategoriesPage cityId={cityId} venueId={venueId} />;
}
