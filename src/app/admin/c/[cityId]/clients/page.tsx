import { PageHeader } from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import ClientsTable from "@/features/clients/ClientsTable";

export default async function ClientsPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;

  return (
    <div className="ui-grid">
      <PageHeader
        title={`Клієнти — ${cityId}`}
        description="Список клієнтів по місту: кількість замовлень, сума витрат, останнє замовлення. Таблиця підтримує сортування."
      />

      <Card>
        <ClientsTable cityId={cityId} />
      </Card>
    </div>
  );
}
