import VenueCreateForm from "@/features/venues/VenueCreateForm";

export default async function VenueCreatePage({
  params,
}: {
  params: Promise<{ cityId: string }>;
}) {
  const { cityId } = await params;
  return <VenueCreateForm cityId={cityId} />;
}
