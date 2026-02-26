import Link from "next/link";
import { PageHeader } from "@/components/ui/Page";
import styles from "./admin-index.module.css";

export default function AdminIndex() {
  // /admin is the entry point for both guests and authenticated users.
  // AdminShell will render login for guests; for authed users we show this dashboard.
  return (
    <div className="ui-grid">
      <PageHeader
        title="Адмінка Mozi"
        description="Швидкий доступ до основних розділів: міста, заклади, меню, замовлення та налаштування."
      />

      <div className={styles.grid}>
        <Link href="/admin/menu" className={`ui-card ${styles.card}`}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Меню</div>
          <div className="ui-subtitle" style={{ marginTop: 8 }}>
            Категорії, страви, інгредієнти, модифікатори, стоп-лист.
          </div>
        </Link>

        <Link href="/admin/venues" className={`ui-card ${styles.card}`}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Заклади</div>
          <div className="ui-subtitle" style={{ marginTop: 8 }}>
            Додавання/редагування закладів, медіа, розклад, типи.
          </div>
        </Link>

        <Link href="/admin/orders" className={`ui-card ${styles.card}`}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Замовлення</div>
          <div className="ui-subtitle" style={{ marginTop: 8 }}>
            Перегляд та статуси замовлень, фільтри, клієнти.
          </div>
        </Link>

        <Link href="/admin/cities" className={`ui-card ${styles.card}`}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Міста</div>
          <div className="ui-subtitle" style={{ marginTop: 8 }}>
            Список міст, фото, піддомени/налаштування міста.
          </div>
        </Link>

        <Link href="/admin/users" className={`ui-card ${styles.card}`}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Користувачі</div>
          <div className="ui-subtitle" style={{ marginTop: 8 }}>
            Видача ролей, доступи, керування адміністраторами.
          </div>
        </Link>

        <Link href="/admin/settings" className={`ui-card ${styles.card}`}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Налаштування</div>
          <div className="ui-subtitle" style={{ marginTop: 8 }}>
            Тексти сайту, SEO, сторінка після оплати, контакти.
          </div>
        </Link>
      </div>
    </div>
  );
}
