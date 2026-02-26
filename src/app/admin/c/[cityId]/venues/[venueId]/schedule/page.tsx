import VenueScheduleTab from "@/features/venues/VenueScheduleTab";

export default async function VenueSchedulePage({
  params,
}: {
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;
  return <VenueScheduleTab cityId={cityId} venueId={venueId} />;
}
