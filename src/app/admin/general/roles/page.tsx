import { PageHeader } from "@/components/ui/Page";
import RolesClient from "@/features/roles/RolesClient";

export default function RolesPage() {
  return (
    <div className="ui-grid">
      <PageHeader
        title="Ролі"
        description="Створюйте та редагуйте ролі. Кожна роль визначає, які розділи адмінки доступні користувачу."
      />
      <RolesClient />
    </div>
  );
}
