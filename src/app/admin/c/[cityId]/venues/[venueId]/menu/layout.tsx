import MenuSubTabs from "@/features/menu/MenuSubTabs";

export default async function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ cityId: string; venueId: string }>;
}) {
  const { cityId, venueId } = await params;

  return (
    <div className="ui-grid">
      <MenuSubTabs cityId={cityId} venueId={venueId} />
      {children}
    </div>
  );
}
