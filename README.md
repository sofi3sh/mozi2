# mozi — Admin + Site (Next.js 14) + MySQL (Prisma)

Цей репозиторій містить:
- **Адмінку** (Owner/Admin/SEO) з multi-city даними
- **Сайт** (вітрина) з перемиканням міст/мов (UA/RU) + SEO-оверлей для ролі SEO (через `?seo=1`)
- **MySQL 8.0 + Prisma**: всі міста/заклади/меню/клієнти/замовлення/SEO/налаштування зберігаються в БД

> Авторизація зараз **демо** (localStorage-сесія), щоб ви могли швидко перевірити UX.
> Далі підʼєднаємо реальну auth (наприклад NextAuth або власний JWT).

---

## 1) Налаштування .env

Створіть `.env` в корені і вставте ваші дані MySQL:

```env
DATABASE_URL="mysql://LOGIN:PASSWORD@ay606997.mysql.tools:3306/ay606997_mozi"
```

---

## 2) Міграції + seed

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

---

## 3) Запуск

```bash
npm run dev
```

### Адмінка
- `/login` — демо-вхід
- `/admin/menu` — стартова “Головна”
- `/admin/cities` — міста

### Сайт
- `/` — головна
- `/categories?city=kyiv` — категорії
- `/venues?city=kyiv` — заклади
- `/venue/smak?city=kyiv` — сторінка закладу

### SEO overlay (тільки для SEO)
- На сайті додайте `?seo=1` (ви переходите на сайт через кнопку/посилання з адмінки для SEO)

---

## DB схеми

Prisma схема: `prisma/schema.prisma`

Seed-дані: `prisma/seed.mjs` (міста, демо-заклад, категорії, страва, клієнт, замовлення, користувачі, базові налаштування).
