import { PageHeader } from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import OrdersTable from "@/features/orders/OrdersTable";

export default async function OrdersPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;

  return (
    <div className="ui-grid">
      <PageHeader
        title={`Замовлення — ${cityId}`}
        description="Таблиця замовлень з пошуком, фільтрами та сортуванням. Статус можна змінювати прямо в рядку."
      />

      <Card>
        <OrdersTable cityId={cityId} />
      </Card>
    </div>
  );
}
