import { PageHeader } from "@/components/ui/Page";
import CityDashboardClient from "@/features/dashboard/CityDashboardClient";

export default async function CityDashboardPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;

  return (
    <div className="ui-grid">
      <PageHeader
        title={`Дашборд міста: ${cityId}`}
        description="Коротка статистика і швидкі переходи. Вся адмінка працює в межах вибраного міста."
      />
      <CityDashboardClient cityId={cityId} />
    </div>
  );
}
