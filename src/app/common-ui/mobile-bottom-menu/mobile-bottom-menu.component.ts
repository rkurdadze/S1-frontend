import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { map, filter } from 'rxjs/operators';

import { CartService } from '../../data/services/cart.service';
import { GoogleAuthService } from '../../data/services/google-auth.service';
import { MobileBottomMenuItemComponent } from './mobile-bottom-menu-item.component';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
import { PROFILE_MENU_ITEMS } from '../profile-menu/profile-menu.config';
import { ProfileMenuItem } from '../profile-menu/profile-menu.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {NavigationEnd, Router, RouterLink, UrlTree} from '@angular/router';

interface BottomNavItem {
  labelKey: string;
  icon: ProfileMenuItem['icon'];
  routerLink: string | any[];
  exact?: boolean;
  hasBadge?: boolean;
}

@Component({
  selector: 'app-mobile-bottom-menu',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    RouterLink,
    TranslateModule,
    MobileBottomMenuItemComponent,
    ProfileMenuComponent
  ],
  templateUrl: './mobile-bottom-menu.component.html',
  styleUrl: './mobile-bottom-menu.component.scss'
})
export class MobileBottomMenuComponent {
  private cartService = inject(CartService);
  private googleAuth = inject(GoogleAuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly profileMenuItems = PROFILE_MENU_ITEMS.filter(item => item.action !== 'addItem');

  cartCount$ = this.cartService.items$.pipe(
    map(items => items.reduce((total, item) => total + item.quantity, 0))
  );

  isProfileMenuOpen = false;
  isLoggedIn = false;
  isAdmin = false;
  activeUrl = this.router.url;

  navItems: BottomNavItem[] = [
    { labelKey: 'mobileNav.home', icon: 'home', routerLink: '/', exact: true },
    { labelKey: 'mobileNav.cart', icon: 'cart', routerLink: '/cart', hasBadge: true },
    { labelKey: 'mobileNav.catalog', icon: 'catalog', routerLink: '/catalog' },
  ];

  constructor() {
    this.googleAuth.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.isAdmin = this.googleAuth.isAdmin;
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: any) => {
        this.activeUrl = event.urlAfterRedirects ?? event.url;
        this.isProfileMenuOpen = false;
      });
  }

  get profileLabelKey(): string {
    return this.isLoggedIn ? 'mobileNav.profile' : 'mobileNav.login';
  }

  @HostListener('document:keydown.escape')
  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  onProfileTap(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']).then();
      return;
    }
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  onProfileItemSelect(item: ProfileMenuItem): void {
    this.isProfileMenuOpen = false;

    if (item.action === 'logout') {
      this.googleAuth.logout();
      return;
    }

    if (item.action === 'addItem') {
      return;
    }

    if (item.routerLink) {
      this.router.navigate(Array.isArray(item.routerLink) ? item.routerLink : [item.routerLink]).then();
    }
  }

  isActive(route: string | any[], exact = false): boolean {
    const url = Array.isArray(route)
        ? this.router.createUrlTree(route)
        : route;

    return this.router.isActive(url, exact);
  }
}
