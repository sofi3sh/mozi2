import VenueOverview from "@/features/venues/VenueOverview";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <VenueOverview cityId={cityId} venueId={venueId} />;
}
