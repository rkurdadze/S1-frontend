export type ProfileMenuAction = 'logout' | 'addItem';

export type ProfileMenuIcon = 'home' | 'cart' | 'catalog' | 'profile' | 'logout' | 'add';

export interface ProfileMenuItem {
  labelKey: string;
  icon: ProfileMenuIcon;
  routerLink?: string | any[];
  action?: ProfileMenuAction;
  requiresAuth?: boolean;
  guestOnly?: boolean;
  adminOnly?: boolean;
}

export const PROFILE_MENU_ICON_PATHS: Record<ProfileMenuIcon, string[]> = {
  home: [
    'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  ],
  cart: [
    'M2.25 2.25h1.386a1.125 1.125 0 0 1 1.087.871L5.91 7.5h12.09a1.125 1.125 0 0 1 1.1 1.332l-1.13 5.25a1.125 1.125 0 0 1-1.1.918H8.397a1.125 1.125 0 0 1-1.1-.918L5.527 4.5H3',
    'M7 20.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z',
    'M17 20.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z',
  ],
  catalog: [
    'M4 4h6v6H4z',
    'M14 4h6v6h-6z',
    'M4 14h6v6H4z',
    'M14 14h6v6h-6z',
  ],
  profile: [
    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M6 18.25C6 16.13 8.686 14 12 14s6 2.13 6 4.25V20H6z',
  ],
  logout: [
    'M12.5 4.5v3h-4v9h4v3l6-7.5z',
    'M6 6h5v2H8v8h3v2H6z',
  ],
  add: [
    'M12 4v7.5H4.5v3H12V22h3v-7.5h7.5v-3H15V4z',
  ],
};
