import {Component, inject, OnDestroy} from '@angular/core';
import {ItemCardComponent} from '../../common-ui/item-card/item-card.component';
import {Item} from '../../data/interfaces/item.interface';
import {ItemService} from '../../data/services/item.service';
import {JsonPipe, NgFor, NgIf} from '@angular/common';
import {Subscription} from "rxjs";
import {TranslateModule, TranslateService} from "@ngx-translate/core";

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
    TranslateModule
  ],
  templateUrl: './outwear.component.html',
  styleUrl: './outwear.component.scss'
})
export class OutwearComponent implements OnDestroy {
  itemService = inject(ItemService);
  items: Item[] = [];
  private itemAddedSubscription!: Subscription;

  highlightCollections: CollectionCard[] = [];
  lookbookFrames: any[] = [];
  perks: any[] = [];
  editorials: EditorialStory[] = [];

  communityGrid = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'
  ];

  constructor(private translate: TranslateService) {
    this.refreshItems();

    this.itemAddedSubscription = this.itemService.getItemAddedListener().subscribe(() => {
      this.refreshItems();
    });

    this.translate.get('outwear').subscribe(outwear => {
      this.highlightCollections = outwear.highlightCollections.map((item: any) => ({
        ...item,
        image: this.getHighlightCollectionImage(item.id),
        anchor: this.getHighlightCollectionAnchor(item.id)
      }));
      this.lookbookFrames = outwear.lookbookFrames.map((item: any) => ({
        ...item,
        image: this.getLookbookFrameImage(item.id)
      }));
      this.perks = outwear.perks;
      this.editorials = outwear.editorials.map((item: any) => ({
        ...item,
        image: this.getEditorialImage(item.id)
      }));
    });
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
      return '#lookbook';
    }
    return '';
  }

  private getLookbookFrameImage(id: string): string {
    if (id === 'monochrome-layering') {
      return 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80';
    }
    if (id === 'nordic-light') {
      return 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?auto=format&fit=crop&w=800&q=80';
    }
    if (id === 'evening-stroll') {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
    }
    return '';
  }

  private getEditorialImage(id: string): string {
    if (id === 'puffer-jacket') {
      return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80';
    }
    if (id === 'graphite-color') {
      return 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80';
    }
    return '';
  }

  refreshItems() {
    this.itemService.getItems().subscribe(
      val => this.items = val
    );
  }

  ngOnDestroy() {
    if (this.itemAddedSubscription) {
      this.itemAddedSubscription.unsubscribe();
    }
  }
}