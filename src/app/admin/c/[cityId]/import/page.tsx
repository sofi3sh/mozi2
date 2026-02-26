import { PageHeader } from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import ImportClient from "@/features/import/ImportClient";

export default async function ImportPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;

  return (
    <div className="ui-grid">
      <PageHeader
        title={`Імпорт — ${cityId}`}
        description="Імпорт страв з Excel (XLSX). Завантажте шаблон, заповніть та імпортуйте — страви/категорії/варіації/інгредієнти створяться автоматично."
      />

      <Card>
        <ImportClient cityId={cityId} />
      </Card>
    </div>
  );
}
