import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { map, filter } from 'rxjs/operators';

import { CartService } from '../../data/services/cart.service';
import { GoogleAuthService } from '../../data/services/google-auth.service';
import { MobileBottomMenuItemComponent } from './mobile-bottom-menu-item.component';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
import { PROFILE_MENU_ITEMS } from '../profile-menu/profile-menu.config';
import { ProfileMenuItem } from '../profile-menu/profile-menu.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ItemPurchaseBarComponent } from '../item-purchase-bar/item-purchase-bar.component';
import { ItemPurchaseBarService, PurchaseBarState } from '../item-purchase-bar/item-purchase-bar.service';

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
    ProfileMenuComponent,
    ItemPurchaseBarComponent
  ],
  templateUrl: './mobile-bottom-menu.component.html',
  styleUrl: './mobile-bottom-menu.component.scss'
})
export class MobileBottomMenuComponent implements AfterViewInit, OnDestroy {
  private cartService = inject(CartService);
  private googleAuth = inject(GoogleAuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private purchaseBarService = inject(ItemPurchaseBarService);

  @ViewChild('navRef') navRef!: ElementRef<HTMLDivElement>;
  @ViewChild('purchaseRef') purchaseRef?: ElementRef<HTMLDivElement>;

  readonly profileMenuItems = PROFILE_MENU_ITEMS;

  cartCount$ = this.cartService.items$.pipe(
    map(items => items.reduce((total, item) => total + item.quantity, 0))
  );

  isProfileMenuOpen = false;
  isLoggedIn = false;
  isAdmin = false;
  activeUrl = this.router.url;
  purchaseState: PurchaseBarState | null = null;

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
        this.isAdmin = this.googleAuth.isAdminOrManager;
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

    this.purchaseBarService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.purchaseState = state;
        this.updateOffsets();
      });
  }

  get profileLabelKey(): string {
    return this.isLoggedIn ? 'mobileNav.profile' : 'mobileNav.login';
  }

  ngAfterViewInit(): void {
    this.updateOffsets();
  }

  ngOnDestroy(): void {
    document.documentElement.style.removeProperty('--mobile-bottom-offset');
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
      this.router.navigate(['/']).then(() => {
        window.scrollTo(0, 0);
      });
      return;
    }

    if (item.routerLink) {
      this.router.navigate(Array.isArray(item.routerLink) ? item.routerLink : [item.routerLink]).then(() => {
        window.scrollTo(0, 0);
      });
    }
  }

  onNavItemClick(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isActive(route: string | any[], exact = false): boolean {
    const url = Array.isArray(route)
        ? this.router.createUrlTree(route)
        : route;

    return this.router.isActive(url, exact);
  }

  private updateOffsets(): void {
    queueMicrotask(() => {
      const navHeight = this.navRef?.nativeElement?.offsetHeight ?? 0;
      const purchaseHeight = this.purchaseState?.visible ? (this.purchaseRef?.nativeElement?.offsetHeight ?? 0) : 0;
      const total = navHeight + purchaseHeight;
      document.documentElement.style.setProperty('--mobile-bottom-offset', `${total}px`);
    });
  }
}
