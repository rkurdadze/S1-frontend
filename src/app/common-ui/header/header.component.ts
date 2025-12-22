import { Component, DestroyRef, HostListener, inject, NgZone } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { AsyncPipe, NgFor, NgIf } from "@angular/common";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GoogleAuthService } from '../../data/services/google-auth.service';
import { LoginButtonComponent } from "../login-button/login-button.component";
import { BASE_API_URL } from "../../app.config";
import { CartService } from "../../data/services/cart.service";
import { ToastService } from "../toast-container/toast.service";
import { ProfileMenuComponent } from "../profile-menu/profile-menu.component";
import { PROFILE_MENU_ITEMS } from "../profile-menu/profile-menu.config";
import { ProfileMenuItem } from "../profile-menu/profile-menu.types";
import { OverlayService } from '../../data/services/overlay.service';
import { MAIN_NAV_ITEMS, MainNavItem } from "../navigation/main-nav-items";

type SupportedLanguage = 'ka' | 'en' | 'ru';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    LoginButtonComponent,
    RouterLink,
    TranslateModule,
    ProfileMenuComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  isLoggedIn$: Observable<any>;
  private cartService = inject(CartService);
  cartCount$ = this.cartService.items$.pipe(map(items => items.reduce((total, item) => total + item.quantity, 0)));
  baseApiUrl = inject(BASE_API_URL);
  userIcon: string | null = null;
  isAdmin: boolean = false;
  private readonly storageKey = 'studio101_language';
  languages: Array<{ code: SupportedLanguage; flag: string; label: string }> = [
    { code: 'ka', flag: '🇬🇪', label: 'ქართული' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' }
  ];
  currentLanguage: SupportedLanguage;
  navItems = MAIN_NAV_ITEMS;
  headerNavItems = MAIN_NAV_ITEMS.filter(item => item.showInHeader !== false);
  profileMenuItems = PROFILE_MENU_ITEMS;
  isLoggedIn = false;
  isProfileMenuOpen = false;

  private router = inject(Router);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);
  private overlayService = inject(OverlayService);
  languageDropdownOpen = false;


  constructor(private googleAuth: GoogleAuthService) {
    this.translate.addLangs(this.languages.map(({ code }) => code));
    const initialLanguage = this.loadLanguage();
    this.translate.setDefaultLang('ka');
    this.translate.use(initialLanguage);
    this.currentLanguage = initialLanguage;
    this.isLoggedIn$ = this.googleAuth.user$;

    // Подписываемся на изменения пользователя и обновляем `userIcon`
    this.isLoggedIn$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user && user.id) {
          this.userIcon = `${this.baseApiUrl}auth/${user.id}` || null;
          this.isAdmin = googleAuth.isAdminOrManager;
          this.isLoggedIn = true;
        } else {
          this.userIcon = null;
          this.isLoggedIn = false;
        }
      });

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLanguage = event.lang as SupportedLanguage;
      });
  }


  setLanguage(language: SupportedLanguage): void {
    if (language === this.currentLanguage) {
      this.languageDropdownOpen = false;
      return;
    }

    this.translate.use(language);
    this.persistLanguage(language);
    this.languageDropdownOpen = false;
  }

  logout(): void {
    this.googleAuth.logout();
    this.router.navigate(['/']).then();
  }


  toggleMenu(): void {
    this.overlayService.toggleMenu();
  }


  addToFavorites(): void {
    const isMac = /Mac/i.test(navigator.userAgent);
    const shortcut = isMac ? '⌘ Cmd + D' : 'Ctrl + D';

    const message = this.translate.instant('toast.favorites', { shortcut });

    this.toastService.info(
      message,
      { autoClose: true, duration: 5000 }
    );
  }


  onNavItemSelect(event: MouseEvent, item: MainNavItem): void {
    event.preventDefault();
    this.isProfileMenuOpen = false;

    if (item.route) {
      this.router.navigate([item.route]).then();
      return;
    }

    if (!item.fragment) {
      return;
    }

    const runScroll = () => this.scrollToAnchor(item.fragment!);

    // если мы уже на главной — просто скроллим
    if (this.router.url.startsWith('/#') || this.router.url === '/' || this.router.url.includes('#')) {
      runScroll();
    } else {
      // если мы НЕ на странице с якорями — сначала переходим, потом скроллим
      this.router.navigate(['/'], { fragment: item.fragment }).then(() => {
        this.zone.onStable
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            // Angular полностью стабилизировался — DOM гарантированно готов
            this.scrollToAnchor(item.fragment!);
          });
      });
    }
  }

  private scrollToAnchor(targetId: string): void {
    const target = document.getElementById(targetId);
    if (!target) return;

    history.pushState(null, '', `#${targetId}`);

    const targetTop = target.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: targetTop - 10,
      behavior: 'smooth'
    });
  }

  private loadLanguage(): SupportedLanguage {
    try {
      const saved = localStorage.getItem(this.storageKey) as SupportedLanguage | null;
      if (saved && this.languages.some(({ code }) => code === saved)) {
        return saved;
      }
    } catch (error) {
      // ignore storage errors
    }

    return 'ka';
  }

  private persistLanguage(language: SupportedLanguage): void {
    try {
      localStorage.setItem(this.storageKey, language);
    } catch (error) {
      // ignore storage errors
    }
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = false;
    this.languageDropdownOpen = !this.languageDropdownOpen;
  }

  onLanguageSelect(language: SupportedLanguage): void {
    this.setLanguage(language);
  }

  get currentLanguageOption(): { code: SupportedLanguage; flag: string; label: string } {
    return this.languages.find(language => language.code === this.currentLanguage) ?? this.languages[0];
  }

  @HostListener('document:click')
  closeLanguageDropdown(): void {
    this.languageDropdownOpen = false;
    this.isProfileMenuOpen = false;
  }

  onProfileMenuSelect(item: ProfileMenuItem): void {
    this.isProfileMenuOpen = false;

    if (item.action === 'logout') {
      this.logout();
      return;
    }

    if (item.routerLink) {
      this.router.navigate(Array.isArray(item.routerLink) ? item.routerLink : [item.routerLink]).then();
    }
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.languageDropdownOpen = false;
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }
}
