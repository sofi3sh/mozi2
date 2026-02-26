import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function main() {
  // Cities
  const cities = [
    { id: "kyiv", name: "Київ" },
    { id: "lviv", name: "Львів" },
    { id: "odesa", name: "Одеса" },
  ];

  for (const c of cities) {
    await prisma.city.upsert({
      where: { id: c.id },
      update: { name: c.name },
      create: c,
    });
  }

  // System roles + permissions (nav sections)
  const roles = [
    {
      key: "owner",
      title: "Власник",
      isSystem: true,
      permissions: {
        nav: [
          "home",
          "cities",
          "integrations",
          "pages",
          "general_settings",
          "city_dashboard",
          "venues",
          "menu",
          "orders",
          "clients",
          "seo",
          "analytics",
          "users",
          "import",
        ],
      },
    },
    {
      key: "admin",
      title: "Адмін",
      isSystem: true,
      permissions: {
        nav: [
          "home",
          "cities",
          "integrations",
          "pages",
          "general_settings",
          "city_dashboard",
          "venues",
          "menu",
          "orders",
          "clients",
          "analytics",
          "import",
        ],
      },
    },
    {
      key: "seo",
      title: "SEO",
      isSystem: true,
      permissions: { nav: ["home", "city_dashboard", "menu", "seo"] },
    },
    {
      key: "guest",
      title: "Гість",
      isSystem: true,
      permissions: { nav: [] },
    },
  ];

  for (const r of roles) {
    await prisma.appRole.upsert({
      where: { key: r.key },
      update: { title: r.title, permissions: r.permissions, isSystem: r.isSystem },
      create: r,
    });
  }

  // Catalog items (global)
  // We set stable IDs so we can reference them from venues.
  const venueTypes = [
    { id: "vt_restaurant", kind: "venueType", name: "Ресторан" },
    { id: "vt_cafe", kind: "venueType", name: "Кафе" },
    { id: "vt_pizza", kind: "venueType", name: "Піцерія" },
    { id: "vt_burger", kind: "venueType", name: "Бургерна" },
    { id: "vt_sushi", kind: "venueType", name: "Суші" },
  ];
  const cuisineTypes = [
    { id: "ct_ua", kind: "cuisineType", name: "Українська" },
    { id: "ct_it", kind: "cuisineType", name: "Італійська" },
    { id: "ct_asia", kind: "cuisineType", name: "Азійська" },
    { id: "ct_burger", kind: "cuisineType", name: "Американська" },
  ];

  for (const item of [...venueTypes, ...cuisineTypes]) {
    await prisma.catalogItem.upsert({
      where: { kind_name: { kind: item.kind, name: item.name } },
      update: { id: item.id },
      create: item,
    });
  }

  const VT = Object.fromEntries(venueTypes.map((x) => [x.name, x.id]));
  const CT = Object.fromEntries(cuisineTypes.map((x) => [x.name, x.id]));

  const defaultSchedule = [
    { day: "mon", isClosed: false, open: "09:00", close: "21:00" },
    { day: "tue", isClosed: false, open: "09:00", close: "21:00" },
    { day: "wed", isClosed: false, open: "09:00", close: "21:00" },
    { day: "thu", isClosed: false, open: "09:00", close: "21:00" },
    { day: "fri", isClosed: false, open: "09:00", close: "22:00" },
    { day: "sat", isClosed: false, open: "10:00", close: "22:00" },
    { day: "sun", isClosed: false, open: "10:00", close: "21:00" },
  ];

  const venues = [
    {
      id: "v_kyiv_smak",
      cityId: "kyiv",
      name: "Ресторан «Смак»",
      description: "Домашня кухня та швидка доставка.",
      address: "Вул. Васильківська 24",
      deliveryMinutes: 45,
      slug: "smak",
      photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=70",
      venueTypeIds: [VT["Ресторан"]],
      cuisineTypeIds: [CT["Українська"]],
      schedule: defaultSchedule,
    },
    {
      id: "v_kyiv_papa",
      cityId: "kyiv",
      name: "Papa Pizza",
      description: "Піцца з печі, паста та закуски.",
      address: "Просп. Перемоги 12",
      deliveryMinutes: 35,
      slug: "papa-pizza",
      photoUrl: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1600&q=70",
      venueTypeIds: [VT["Піцерія"]],
      cuisineTypeIds: [CT["Італійська"]],
      schedule: defaultSchedule,
    },
    {
      id: "v_lviv_coffee",
      cityId: "lviv",
      name: "Львівська Кава",
      description: "Кава, десерти та сніданки.",
      address: "Пл. Ринок 3",
      deliveryMinutes: 30,
      slug: "lviv-coffee",
      photoUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=70",
      venueTypeIds: [VT["Кафе"]],
      cuisineTypeIds: [CT["Українська"]],
      schedule: defaultSchedule,
    },
    {
      id: "v_lviv_burger",
      cityId: "lviv",
      name: "Burger Lab",
      description: "Соковиті бургери та картопля фрі.",
      address: "Вул. Городоцька 21",
      deliveryMinutes: 40,
      slug: "burger-lab",
      photoUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=70",
      venueTypeIds: [VT["Бургерна"]],
      cuisineTypeIds: [CT["Американська"]],
      schedule: defaultSchedule,
    },
    {
      id: "v_odesa_sushi",
      cityId: "odesa",
      name: "Sushi Wave",
      description: "Роли, сети та поке — швидко і свіжо.",
      address: "Дерибасівська 10",
      deliveryMinutes: 50,
      slug: "sushi-wave",
      photoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=70",
      venueTypeIds: [VT["Суші"]],
      cuisineTypeIds: [CT["Азійська"]],
      schedule: defaultSchedule,
    },
  ];

  // When we upsert venues by (cityId, slug), the DB may already contain a venue with that key
  // but with a different `id` than our fixture ids. Downstream seed data references fixture ids,
  // so we keep a mapping from fixture id -> actual id returned by Prisma.
  const venueIdMap = {};

  for (const v of venues) {
    // Upsert by the real unique key to avoid P2002 when the DB already contains
    // a venue with the same (cityId, slug) but a different id (e.g. after manual edits).
    const { id, ...rest } = v;
    const saved = await prisma.venue.upsert({
      where: { cityId_slug: { cityId: v.cityId, slug: v.slug } },
      update: rest,
      create: v,
    });

    venueIdMap[v.id] = saved.id;
  }

  const mapVenueId = (id) => venueIdMap[id] || id;

  const categories = [
    { id: "cat_kyiv_smak_hot", cityId: "kyiv", venueId: "v_kyiv_smak", name: "Гарячі страви", sort: 10 },
    { id: "cat_kyiv_smak_drinks", cityId: "kyiv", venueId: "v_kyiv_smak", name: "Напої", sort: 20 },
    { id: "cat_kyiv_papa_pizza", cityId: "kyiv", venueId: "v_kyiv_papa", name: "Піца", sort: 10 },
    { id: "cat_kyiv_papa_pasta", cityId: "kyiv", venueId: "v_kyiv_papa", name: "Паста", sort: 20 },
    { id: "cat_lviv_coffee_breakfast", cityId: "lviv", venueId: "v_lviv_coffee", name: "Сніданки", sort: 10 },
    { id: "cat_lviv_coffee_dessert", cityId: "lviv", venueId: "v_lviv_coffee", name: "Десерти", sort: 20 },
    { id: "cat_lviv_burger_burgers", cityId: "lviv", venueId: "v_lviv_burger", name: "Бургери", sort: 10 },
    { id: "cat_lviv_burger_snacks", cityId: "lviv", venueId: "v_lviv_burger", name: "Снеки", sort: 20 },
    { id: "cat_odesa_sushi_rolls", cityId: "odesa", venueId: "v_odesa_sushi", name: "Роли", sort: 10 },
    { id: "cat_odesa_sushi_sets", cityId: "odesa", venueId: "v_odesa_sushi", name: "Сети", sort: 20 },
  ];

  for (const c of categories) {
    await prisma.menuCategory.upsert({
      where: { id: c.id },
      update: { ...c, venueId: mapVenueId(c.venueId) },
      create: { ...c, venueId: mapVenueId(c.venueId) },
    });
  }

  const modifierGroups = [
    {
      id: "mg_sauces_kyiv",
      cityId: "kyiv",
      venueId: "v_kyiv_smak",
      title: "Соуси",
      required: false,
      minSelect: 0,
      maxSelect: 3,
      options: [
        { id: "mo_ketchup", name: "Кетчуп", priceDelta: 0, isStopped: false },
        { id: "mo_garlic", name: "Часниковий", priceDelta: 10, isStopped: false },
        { id: "mo_bbq", name: "BBQ", priceDelta: 12, isStopped: false },
      ],
    },
    {
      id: "mg_pizza_extra",
      cityId: "kyiv",
      venueId: "v_kyiv_papa",
      title: "Додаткові інгредієнти",
      required: false,
      minSelect: 0,
      maxSelect: 4,
      options: [
        { id: "mo_cheese", name: "Екстра сир", priceDelta: 25, isStopped: false },
        { id: "mo_bacon", name: "Бекон", priceDelta: 35, isStopped: false },
        { id: "mo_mush", name: "Гриби", priceDelta: 20, isStopped: false },
      ],
    },
  ];

  for (const mg of modifierGroups) {
    await prisma.modifierGroup.upsert({
      where: { id: mg.id },
      update: { ...mg, venueId: mapVenueId(mg.venueId) },
      create: { ...mg, venueId: mapVenueId(mg.venueId) },
    });
  }

  const dishes = [
    {
      id: "dish_smak_borshch",
      cityId: "kyiv",
      venueId: "v_kyiv_smak",
      categoryId: "cat_kyiv_smak_hot",
      name: "Борщ з пампушками",
      description: "Класичний український борщ, сметана та часникові пампушки.",
      price: 165,
      photoUrl: "https://images.unsplash.com/photo-1604908554162-5b6b8d6f1dbd?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: ["mg_sauces_kyiv"],
    },
    {
      id: "dish_smak_cutlet",
      cityId: "kyiv",
      venueId: "v_kyiv_smak",
      categoryId: "cat_kyiv_smak_hot",
      name: "Котлета по-київськи",
      description: "Соковита куряча котлета з вершковим маслом, картопляне пюре.",
      price: 219,
      photoUrl: "https://images.unsplash.com/photo-1604908176997-125b58a9acbd?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: [],
    },
    {
      id: "dish_papa_margarita",
      cityId: "kyiv",
      venueId: "v_kyiv_papa",
      categoryId: "cat_kyiv_papa_pizza",
      name: "Маргарита",
      description: "Томати, моцарела, соус з базиліком.",
      price: 199,
      photoUrl: "https://images.unsplash.com/photo-1548365328-5f92a2b57f49?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: ["mg_pizza_extra"],
    },
    {
      id: "dish_papa_pepperoni",
      cityId: "kyiv",
      venueId: "v_kyiv_papa",
      categoryId: "cat_kyiv_papa_pizza",
      name: "Пепероні",
      description: "Пепероні, моцарела, томатний соус.",
      price: 259,
      photoUrl: "https://images.unsplash.com/photo-1601924582975-7e670c6a1803?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: ["mg_pizza_extra"],
    },
    {
      id: "dish_lviv_eggs",
      cityId: "lviv",
      venueId: "v_lviv_coffee",
      categoryId: "cat_lviv_coffee_breakfast",
      name: "Скрембл з тостами",
      description: "Ніжний скрембл, тости з вершковим маслом та зелень.",
      price: 145,
      photoUrl: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: [],
    },
    {
      id: "dish_lviv_cheesecake",
      cityId: "lviv",
      venueId: "v_lviv_coffee",
      categoryId: "cat_lviv_coffee_dessert",
      name: "Чізкейк",
      description: "Класичний чізкейк з ягідним топінгом.",
      price: 120,
      photoUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: [],
    },
    {
      id: "dish_burger_classic",
      cityId: "lviv",
      venueId: "v_lviv_burger",
      categoryId: "cat_lviv_burger_burgers",
      name: "Класичний бургер",
      description: "Яловичина, сир, салат, соус, булочка бріош.",
      price: 215,
      photoUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: ["mg_sauces_kyiv"],
    },
    {
      id: "dish_sushi_set",
      cityId: "odesa",
      venueId: "v_odesa_sushi",
      categoryId: "cat_odesa_sushi_sets",
      name: "Сет «Хвиля»",
      description: "Набір ролів: лосось, авокадо, огірок, соуси.",
      price: 499,
      photoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=70",
      isStopped: false,
      modifierGroupIds: [],
    },
  ];

  for (const d of dishes) {
    await prisma.dish.upsert({
      where: { id: d.id },
      update: { ...d, venueId: mapVenueId(d.venueId) },
      create: { ...d, venueId: mapVenueId(d.venueId) },
    });
  }

  // Demo customer + order
  await prisma.customer.upsert({
    where: { id: "cust_1" },
    update: { cityId: "kyiv", name: "Олена М.", phone: "", email: "" },
    create: { id: "cust_1", cityId: "kyiv", name: "Олена М.", phone: "", email: "" },
  });

  await prisma.order.upsert({
    where: { id: "ord_1" },
    update: {
      number: 1024,
      cityId: "kyiv",
      venueId: mapVenueId("v_kyiv_smak"),
      customerId: "cust_1",
      total: 650,
      status: "in_progress",
      paymentStatus: "paid",
      paymentProvider: "manual",
      deliveryMode: "asap",
      deliverAt: new Date(),
      deliveryAddress: { street: "Вул. Васильківська", house: "24", flat: "", comment: "" },
      items: [
        { name: "Борщ з пампушками", qty: 1, price: 165 },
        { name: "Котлета по-київськи", qty: 1, price: 219 },
        { name: "Соус BBQ", qty: 1, price: 12 },
      ],
    },
    create: {
      id: "ord_1",
      number: 1024,
      cityId: "kyiv",
      venueId: mapVenueId("v_kyiv_smak"),
      customerId: "cust_1",
      total: 650,
      status: "in_progress",
      paymentStatus: "paid",
      paymentProvider: "manual",
      deliveryMode: "asap",
      deliverAt: new Date(),
      deliveryAddress: { street: "Вул. Васильківська", house: "24", flat: "", comment: "" },
      items: [
        { name: "Борщ з пампушками", qty: 1, price: 165 },
        { name: "Котлета по-київськи", qty: 1, price: 219 },
        { name: "Соус BBQ", qty: 1, price: 12 },
      ],
    },
  });

  // Demo users (for demo session switcher)
  const defaultPasswordHash = hashPasswordSync("demo1234");
  const users = [
    { name: "Олександр", email: "owner@mozi.local", role: "owner", cityIds: [], isActive: true, passwordHash: defaultPasswordHash },
    { name: "Адмін", email: "admin@mozi.local", role: "admin", cityIds: ["kyiv"], isActive: true, passwordHash: defaultPasswordHash },
    { name: "SEO", email: "seo@mozi.local", role: "seo", cityIds: ["kyiv", "lviv"], isActive: true, passwordHash: defaultPasswordHash },
  ];

  for (const u of users) {
    await prisma.appUser.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, cityIds: u.cityIds, isActive: u.isActive, passwordHash: u.passwordHash },
      create: { ...u },
    });
  }

  // Default settings (example)
  await prisma.setting.upsert({
    where: { scope_cityId_key: { scope: "global", cityId: "global", key: "global" } },
    update: {
      value: {
        brandName: "mozi",
        supportEmail: "support@mozi.local",
        defaultLanguage: "ua",
        siteCategoryPhotos: {
          [VT["Ресторан"]]: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=70",
          [VT["Кафе"]]: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=70",
          [VT["Піцерія"]]: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1600&q=70",
          [VT["Бургерна"]]: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=70",
          [VT["Суші"]]: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=70",
        },
        supportPhones: ["+38 (067) 123-45-67", "+38 (050) 987-65-43"],
      },
    },
    create: {
      scope: "global",
      cityId: "global",
      key: "global",
      value: {
        brandName: "mozi",
        supportEmail: "support@mozi.local",
        defaultLanguage: "ua",
        siteCategoryPhotos: {
          [VT["Ресторан"]]: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=70",
          [VT["Кафе"]]: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=70",
          [VT["Піцерія"]]: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1600&q=70",
          [VT["Бургерна"]]: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=70",
          [VT["Суші"]]: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=70",
        },
        supportPhones: ["+38 (067) 123-45-67", "+38 (050) 987-65-43"],
      },
    },
  });

  for (const c of cities) {
    await prisma.setting.upsert({
      where: { scope_cityId_key: { scope: "city", cityId: c.id, key: "city" } },
      update: {
        value: {
          currency: "UAH",
          timezone: "Europe/Kyiv",
          orderAutoAccept: false,
          deliveryEnabled: true,
          pickupEnabled: true,
          minOrderAmount: 0,
        },
      },
      create: {
        scope: "city",
        cityId: c.id,
        key: "city",
        value: {
          currency: "UAH",
          timezone: "Europe/Kyiv",
          orderAutoAccept: false,
          deliveryEnabled: true,
          pickupEnabled: true,
          minOrderAmount: 0,
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
