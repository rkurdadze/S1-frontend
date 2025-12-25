import {Component, DestroyRef, ElementRef, inject, OnDestroy, AfterViewInit, HostListener} from '@angular/core';
import {ItemCardComponent} from '../../common-ui/item-card/item-card.component';
import {Item} from '../../data/interfaces/item.interface';
import {ItemService} from '../../data/services/item.service';
import {JsonPipe, NgFor, NgIf} from '@angular/common';
import {Subscription, catchError, of} from "rxjs";
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {RouterLink} from "@angular/router";
import {AdminApiService} from '../../data/services/admin-api.service';
import {AdminCollection, AdminEditorial} from '../../data/interfaces/admin/admin.interfaces';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {GoogleAuthService} from '../../data/services/google-auth.service';

interface CollectionCard {
  title: string;
  description: string;
  tag: string;
  image: string;
  anchor: string;
}

interface EditorialStory {
  title: string;
  summary: string;
  image: string;
  cta: string;
}

@Component({
  selector: 'app-outwear',
  standalone: true,
  imports: [
    ItemCardComponent,
    JsonPipe,
    NgFor,
    NgIf,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './outwear.component.html',
  styleUrl: './outwear.component.scss'
})
export class OutwearComponent implements OnDestroy, AfterViewInit {
  itemService = inject(ItemService);
  adminApi = inject(AdminApiService);
  googleAuth = inject(GoogleAuthService);
  private destroyRef = inject(DestroyRef);
  items: Item[] = [];
  displayedItems: Item[] = [];
  private itemAddedSubscription!: Subscription;
  private translationSubscription!: Subscription;
  private resizeObserver?: ResizeObserver;

  highlightCollections: CollectionCard[] = [];
  perks: any[] = [];
  editorials: EditorialStory[] = [];

  private translatedOutwear: any = null;
  private adminCollections: AdminCollection[] = [];
  private adminEditorials: AdminEditorial[] = [];

  communityGrid = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'
  ];

  constructor(private translate: TranslateService, private elementRef: ElementRef) {
    this.refreshItems();

    this.itemAddedSubscription = this.itemService.getItemAddedListener().subscribe(() => {
      this.refreshItems();
    });

    this.translationSubscription = this.translate.stream('outwear').subscribe(outwear => {
      this.translatedOutwear = outwear;
      this.updateTranslatedSections(outwear);
    });

    if (this.googleAuth.isAdminOrManager) {
      this.adminApi
        .getCollections()
        .pipe(
          catchError(() => of([])),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: collections => {
            this.adminCollections = collections;
            this.syncEditorialsAndCollections();
          }
        });

      this.adminApi
        .getEditorials()
        .pipe(
          catchError(() => of([])),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: editorials => {
            this.adminEditorials = editorials;
            this.syncEditorialsAndCollections();
          }
        });
    }
  }

  ngAfterViewInit() {
    const itemCardWrapper = this.getItemCardWrapper();
    if (itemCardWrapper) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDisplayedItems();
      });
      this.resizeObserver.observe(itemCardWrapper);
    }
    // Defer the initial update to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.updateDisplayedItems();
    });
  }

  private updateTranslatedSections(outwear: any) {
    if (outwear && typeof outwear === 'object') {
      this.perks = outwear.perks;
    }
    this.syncEditorialsAndCollections();
  }

  private syncEditorialsAndCollections(): void {
    if (this.adminCollections.length) {
      this.highlightCollections = this.adminCollections.map(collection => ({
        title: collection.title,
        description: collection.description,
        tag: collection.tag,
        image: collection.image,
        anchor: collection.anchor
      }));
    } else if (this.translatedOutwear && Array.isArray(this.translatedOutwear.highlightCollections)) {
      this.highlightCollections = this.translatedOutwear.highlightCollections.map((item: any) => ({
        ...item,
        image: this.getHighlightCollectionImage(item.id),
        anchor: this.getHighlightCollectionAnchor(item.id)
      }));
    }

    if (this.adminEditorials.length) {
      this.editorials = this.adminEditorials.map(story => ({
        title: story.title,
        summary: story.summary,
        image: story.image,
        cta: story.cta
      }));
    } else if (this.translatedOutwear && Array.isArray(this.translatedOutwear.editorials)) {
      this.editorials = this.translatedOutwear.editorials.map((item: any) => ({
        ...item,
        image: this.getEditorialImage(item.id)
      }));
    }
  }

  private getHighlightCollectionImage(id: string): string {
    if (id === 'scandi-minimal') {
      return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80';
    }
    if (id === 'city-armor') {
      return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
    }
    if (id === 'weekend-escape') {
      return 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80';
    }
    return '';
  }

  private getHighlightCollectionAnchor(id: string): string {
    if (id === 'scandi-minimal') {
      return '#new-drop';
    }
    if (id === 'city-armor') {
      return '#collections';
    }
    if (id === 'weekend-escape') {
      return '#editorial';
    }
    return '';
  }

  private getEditorialImage(id: string): string {
    if (id === 'puffer-jacket') {
      return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80';
    }
    if (id === 'commuter-looks') {
      return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80';
    }
    if (id === 'elegance-layering') {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80';
    }
    return '';
  }

  refreshItems() {
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      setTimeout(() => this.updateDisplayedItems());
    });
  }

  getItemCardWrapper(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector('.item-card__wrapper');
  }

  updateDisplayedItems() {
    const itemCardWrapper = this.getItemCardWrapper();
    if (!itemCardWrapper) return;

    const wrapperWidth = itemCardWrapper.offsetWidth;
    const cardWidth = 306; // 280px + 26px gap = 306px
    const maxCards = Math.floor(wrapperWidth / cardWidth);

    this.displayedItems = this.items.slice(0, Math.max(6, maxCards));
  }

  @HostListener('window:resize')
  onResize() {
    this.updateDisplayedItems();
  }

  ngOnDestroy() {
    if (this.itemAddedSubscription) {
      this.itemAddedSubscription.unsubscribe();
    }
    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
