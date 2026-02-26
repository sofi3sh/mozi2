import VenueEditForm from "@/features/venues/VenueEditForm";

export default async function VenueEditPage({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <VenueEditForm cityId={cityId} venueId={venueId} />;
}
