import Link from "next/link";
import VenuesList from "@/features/venues/VenuesList";
import { PageHeader } from "@/components/ui/Page";
import { Button } from "@/components/ui/Input";

export default async function VenuesPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;

  return (
    <div className="ui-grid">
      <PageHeader
        title={`Заклади — ${cityId}`}
        description="Список закладів тільки для вибраного міста. Натисніть «Меню», щоб одразу перейти до страв."
        actions={
          <Link href={`/admin/c/${cityId}/venues/new`}>
            <Button type="button">+ Додати заклад</Button>
          </Link>
        }
      />

      <VenuesList cityId={cityId} />
    </div>
  );
}
