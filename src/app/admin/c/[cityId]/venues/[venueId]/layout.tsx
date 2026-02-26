import VenueHeader from "@/features/venues/VenueHeader";
import VenueTabs from "@/features/venues/VenueTabs";

export default async function VenueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;

  return (
    <div className="ui-grid">
      <VenueHeader cityId={cityId} venueId={venueId} />
      <VenueTabs cityId={cityId} venueId={venueId} />
      <div>{children}</div>
    </div>
  );
}
