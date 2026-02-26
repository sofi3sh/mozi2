export const routes = {
  adminRoot: "/admin",
  home: "/admin/menu",
  cities: "/admin/cities",
  city: (cityId: string) => `/admin/c/${cityId}`,
  venues: (cityId: string) => `/admin/c/${cityId}/venues`,
  menuCity: (cityId: string) => `/admin/c/${cityId}/menu`,
  orders: (cityId: string) => `/admin/c/${cityId}/orders`,
  seo: (cityId: string) => `/admin/c/${cityId}/seo`,
};
