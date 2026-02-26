import VenueMediaTab from "@/features/venues/VenueMediaTab";

export default async function VenueMediaPage({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <VenueMediaTab cityId={cityId} venueId={venueId} />;
}
