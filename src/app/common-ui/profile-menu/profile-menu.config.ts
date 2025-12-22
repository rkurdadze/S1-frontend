import { ProfileMenuItem } from './profile-menu.types';

export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  // {
  //   labelKey: 'mobileNav.home',
  //   icon: 'home',
  //   routerLink: '/'
  // },
  // {
  //   labelKey: 'mobileNav.catalog',
  //   icon: 'catalog',
  //   routerLink: '/catalog'
  // },
  // {
  //   labelKey: 'mobileNav.cart',
  //   icon: 'cart',
  //   routerLink: '/cart'
  // },
  {
    labelKey: 'dropdown.profileSettings',
    icon: 'profile',
    routerLink: '/profile',
    requiresAuth: true
  },
  {
    labelKey: 'mobileNav.login',
    icon: 'profile',
    routerLink: '/login',
    guestOnly: true
  },
  {
    labelKey: 'dropdown.logout',
    icon: 'logout',
    action: 'logout',
    requiresAuth: true
  },
  {
    labelKey: 'dropdown.administration',
    icon: 'admin',
    routerLink: '/admin',
    requiresAuth: true,
    adminOnly: true
  }
];
