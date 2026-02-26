import MenuVariationsPage from "@/features/menu/MenuVariationsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <MenuVariationsPage cityId={cityId} venueId={venueId} />;
}

