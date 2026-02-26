import { PageHeader } from "@/components/ui/Page";
import UsersClient from "@/features/users/UsersClient";

export default async function UsersPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;

  return (
    <div className="ui-grid">
      <PageHeader
        title="Користувачі"
        description="Власник керує користувачами: роль, доступ до міст, активність та пароль."
      />
      <UsersClient cityId={cityId} />
    </div>
  );
}
