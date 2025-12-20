export type MainNavItem = {
  key: string;
  route?: string;
  fragment?: string;
  showInHeader?: boolean;
};

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  { key: 'nav.home', route: '/', showInHeader: false },
  { key: 'nav.collections', fragment: 'collections' },
  { key: 'nav.catalog', route: '/catalog' },
  { key: 'nav.new', fragment: 'new-drop' },
  { key: 'nav.stories', fragment: 'editorial' },
  { key: 'nav.subscribe', fragment: 'newsletter' },
];
