import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ItemService } from '../../data/services/item.service';
import { Item } from '../../data/interfaces/item.interface';
import { AdminApiService } from '../../data/services/admin-api.service';
import { GoogleAuthService } from '../../data/services/google-auth.service';
import { EventService } from '../../data/services/event.service';
import { AdminNewsletterSegment } from '../../data/interfaces/admin/admin.interfaces';
import { ADMIN_NAV_ITEMS, AdminNavItem } from './admin-nav.config';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {forkJoin} from 'rxjs';

interface AdminKpi {
  label: string;
  value: number;
  trend: string | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, RouterOutlet, TranslateModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private itemService = inject(ItemService);
  private adminApi = inject(AdminApiService);
  private googleAuth = inject(GoogleAuthService);
  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  kpis: AdminKpi[] = [];
  private ordersCount = 0;
  private newsletterSubscribers = 0;

  navItems: AdminNavItem[] = ADMIN_NAV_ITEMS.map(item => ({ ...item }));
  private itemsCache: Item[] = [];

  ngOnInit(): void {
    if (this.googleAuth.isAdminOrManager) {
      this.loadAdminData();

      this.eventService.refreshAdmin$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadAdminData());
    }
  }

  private loadAdminData(): void {
    this.itemService.getItems().subscribe(items => {
      this.itemsCache = items;
      this.updateItemStats(items);
    });

    this.adminApi.getCategories().subscribe(categories => {
      this.updateNavCount('categories', categories.length);
    });

    this.adminApi.getNews().subscribe(news => {
      this.updateNavCount('news', news.length);
    });

    this.adminApi.getCollections().subscribe(collections => {
      this.updateNavCount('collections', collections.length);
    });

    this.adminApi.getEditorials().subscribe(editorials => {
      this.updateNavCount('editorials', editorials.length);
    });

    this.adminApi.getPromotions().subscribe(promotions => {
      this.updateNavCount('promotions', promotions.length);
    });

    this.adminApi.getUsers().subscribe(users => {
      this.updateNavCount('users', users.length);
    });

    this.adminApi.getOrders().subscribe(orders => {
      this.updateNavCount('orders', orders.length);
      this.updateOrderStats(orders.length);
    });

    forkJoin([
      this.adminApi.getDeliveryZones(),
      this.adminApi.getDeliverySettings()
    ]).subscribe(([zones, settings]) => {
      const enabledSettings = settings.filter(s => s.enabled).length;
      const totalSettings = settings.length;
      const total = totalSettings + zones.length;
      const enabled = enabledSettings + zones.length;
      this.updateNavCount('delivery', `${enabled}/${total}`);
    });

    this.adminApi.getTags().subscribe(tags => {
      this.updateNavCount('tags', tags.length);
    });

    this.adminApi.getNewsletterSegments().subscribe(segments => {
      this.updateNavCount('newsletter', segments.length);
      this.updateNewsletterStats(segments);
    });
  }

  private updateItemStats(items: Item[]): void {
    const published = items.filter(item => item.publish).length;
    const drafts = items.length - published;
    this.updateNavCount('items', items.length);

    this.kpis = [
      { label: 'admin.kpis.active_items', value: published, trend: drafts > 0 ? `admin.kpis.trend_drafts|${drafts}` : null },
      { label: 'admin.kpis.total_items', value: items.length, trend: null },
      { label: 'admin.kpis.orders_today', value: this.ordersCount, trend: null },
      { label: 'admin.kpis.subscribers', value: this.newsletterSubscribers, trend: null }
    ];
  }

  private updateOrderStats(count: number): void {
    this.ordersCount = count;
    this.kpis = this.kpis.map(kpi =>
      kpi.label === 'admin.kpis.orders_today' ? { ...kpi, value: count } : kpi
    );
  }

  private updateNewsletterStats(segments: AdminNewsletterSegment[]): void {
    const total = segments.reduce((sum, segment) => sum + segment.count, 0);
    this.newsletterSubscribers = total;
    this.kpis = this.kpis.map(kpi =>
      kpi.label === 'admin.kpis.subscribers' ? { ...kpi, value: total } : kpi
    );
  }

  private updateNavCount(route: string, count: number | string): void {
    this.navItems = this.navItems.map(item =>
      item.route === route ? { ...item, count } : item
    );
  }

  extractTrendCount(trend: string): number {
    if (!trend) return 0;
    const parts = trend.split('|');
    return parts.length > 1 ? parseInt(parts[1], 10) : 0;
  }
}
