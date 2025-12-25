import { Component, inject, DestroyRef, HostListener, OnInit } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OverlayService } from '../../data/services/overlay.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAIN_NAV_ITEMS } from '../navigation/main-nav-items';
import { GoogleAuthService } from '../../data/services/google-auth.service';
import { map } from 'rxjs/operators';
import { ItemService } from '../../data/services/item.service';
import { AdminApiService } from '../../data/services/admin-api.service';
import { AdminNewsletterSegment } from '../../data/interfaces/admin/admin.interfaces';
import { Item } from '../../data/interfaces/item.interface';
import { ADMIN_NAV_ITEMS, AdminNavItem } from '../../pages/admin/admin-nav.config';
import {forkJoin} from 'rxjs';
import {EventService} from '../../data/services/event.service';

type SupportedLanguage = 'ka' | 'en' | 'ru';

@Component({
  selector: 'app-overlay-menu',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, TranslateModule, AsyncPipe],
  templateUrl: './overlay-menu.component.html',
  styleUrls: ['./overlay-menu.component.scss']
})
export class OverlayMenuComponent implements OnInit {
  private overlayService = inject(OverlayService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private googleAuth = inject(GoogleAuthService);
  private itemService = inject(ItemService);
  private adminApi = inject(AdminApiService);
  private eventService = inject(EventService);

  isMenuOpen = this.overlayService.isMenuOpen;
  languageDropdownOpen = false;
  activeView: 'main' | 'admin' = 'main';

  isAdmin$ = this.googleAuth.user$.pipe(map(() => this.googleAuth.isAdminOrManager));

  adminNavItems: AdminNavItem[] = ADMIN_NAV_ITEMS.map(item => ({
    ...item,
    route: `/admin/${item.route}`
  }));

  languages: Array<{ code: SupportedLanguage; flag: string; label: string }> = [
    { code: 'ka', flag: '🇬🇪', label: 'ქართული' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' }
  ];
  currentLanguage: SupportedLanguage;
  private readonly storageKey = 'studio101_language';


  navItems = MAIN_NAV_ITEMS;

  constructor() {
    const initialLanguage = this.loadLanguage();
    this.translate.setDefaultLang('ka');
    this.translate.use(initialLanguage);
    this.currentLanguage = initialLanguage;

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLanguage = event.lang as SupportedLanguage;
      });
  }

  ngOnInit(): void {
    this.eventService.refreshAdmin$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.googleAuth.isAdminOrManager && this.activeView === 'admin') {
          this.loadAdminCounts();
        }
      });
  }

  private loadAdminCounts(): void {
    this.itemService.getItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items: Item[]) => {
        this.updateNavCount('/admin/items', items.length);
      });

    this.adminApi.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => {
        this.updateNavCount('/admin/categories', categories.length);
      });

    this.adminApi.getNews()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(news => {
        this.updateNavCount('/admin/news', news.length);
      });

    this.adminApi.getCollections()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(collections => {
        this.updateNavCount('/admin/collections', collections.length);
      });

    this.adminApi.getEditorials()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(editorials => {
        this.updateNavCount('/admin/editorials', editorials.length);
      });

    this.adminApi.getPromotions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(promotions => {
        this.updateNavCount('/admin/promotions', promotions.length);
      });

    this.adminApi.getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => {
        this.updateNavCount('/admin/users', users.length);
      });

    this.adminApi.getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(orders => {
        this.updateNavCount('/admin/orders', orders.length);
      });

    forkJoin([
      this.adminApi.getDeliveryZones(),
      this.adminApi.getDeliverySettings()
    ]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([zones, settings]) => {
        const enabledSettings = settings.filter(s => s.enabled).length;
        const totalSettings = settings.length;
        const total = totalSettings + zones.length;
        const enabled = enabledSettings + zones.length;
        this.updateNavCount('/admin/delivery', `${enabled}/${total}`);
      });

    this.adminApi.getTags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tags => {
        this.updateNavCount('/admin/tags', tags.length);
      });

    this.adminApi.getNewsletterSegments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((segments: AdminNewsletterSegment[]) => {
        this.updateNavCount('/admin/newsletter', segments.length);
      });
  }

  toggleMenu(): void {
    this.overlayService.toggleMenu();
  }

  showAdminView(): void {
    this.activeView = 'admin';
    this.loadAdminCounts();
  }

  showMainView(): void {
    this.activeView = 'main';
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.languageDropdownOpen = !this.languageDropdownOpen;
  }

  onLanguageSelect(language: SupportedLanguage): void {
    this.setLanguage(language);
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

  get currentLanguageOption(): { code: SupportedLanguage; flag: string; label: string } {
    return this.languages.find(language => language.code === this.currentLanguage) ?? this.languages[0];
  }

  @HostListener('document:click')
  closeLanguageDropdown(): void {
    this.languageDropdownOpen = false;
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

  private updateNavCount(route: string, count: number | string): void {
    this.adminNavItems = this.adminNavItems.map(item =>
      item.route === route ? { ...item, count } : item
    );
  }
}
