import CityMenuHub from "@/features/menu/CityMenuHub";

export default async function CityMenuPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;
  return <CityMenuHub cityId={cityId} />;
}
