export interface AdminNavItem {
  label: string;
  description: string;
  route: string;
  count: number | string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'admin.nav.items.label',
    description: 'admin.nav.items.desc',
    route: 'items',
    count: 0
  },
  {
    label: 'admin.nav.tags.label',
    description: 'admin.nav.tags.desc',
    route: 'tags',
    count: 0
  },
  {
    label: 'admin.nav.categories.label',
    description: 'admin.nav.categories.desc',
    route: 'categories',
    count: 0
  },
  {
    label: 'admin.nav.news.label',
    description: 'admin.nav.news.desc',
    route: 'news',
    count: 0
  },
  {
    label: 'admin.nav.collections.label',
    description: 'admin.nav.collections.desc',
    route: 'collections',
    count: 0
  },
  {
    label: 'admin.nav.editorials.label',
    description: 'admin.nav.editorials.desc',
    route: 'editorials',
    count: 0
  },
  {
    label: 'admin.nav.orders.label',
    description: 'admin.nav.orders.desc',
    route: 'orders',
    count: 0
  },
  {
    label: 'admin.nav.promotions.label',
    description: 'admin.nav.promotions.desc',
    route: 'promotions',
    count: 0
  },
  {
    label: 'admin.nav.users.label',
    description: 'admin.nav.users.desc',
    route: 'users',
    count: 0
  },
  {
    label: 'admin.nav.newsletter.label',
    description: 'admin.nav.newsletter.desc',
    route: 'newsletter',
    count: 0
  },
  {
    label: 'admin.nav.delivery.label',
    description: 'admin.nav.delivery.desc',
    route: 'delivery',
    count: 0
  }
];
