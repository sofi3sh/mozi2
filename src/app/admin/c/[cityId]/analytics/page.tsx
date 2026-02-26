import { PageHeader } from "@/components/ui/Page";
import AnalyticsClient from "@/features/analytics/AnalyticsClient";

export default async function AnalyticsPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;

  return (
    <div className="ui-grid">
      <PageHeader
        title={`Аналітика — ${cityId}`}
        description="Огляд продажів, статусів замовлень, популярних страв і закладів. Всі дані — в межах поточного міста."
      />
      <AnalyticsClient cityId={cityId} />
    </div>
  );
}
