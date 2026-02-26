import MenuCategoriesPage from "@/features/menu/MenuCategoriesPage";

export default async function MenuIndexPage({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  // Avoid redirects for better UX (and fewer navigation hops):
  // render the default tab (Categories) directly.
  return <MenuCategoriesPage cityId={cityId} venueId={venueId} />;
}
