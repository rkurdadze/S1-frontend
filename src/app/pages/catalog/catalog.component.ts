import { Component, OnDestroy, inject } from '@angular/core';
import { ItemCardComponent } from '../../common-ui/item-card/item-card.component';
import { ItemService } from '../../data/services/item.service';
import { Item } from '../../data/interfaces/item.interface';
import { NgFor, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    ItemCardComponent,
    NgFor,
    NgIf,
    TranslateModule,
    RouterLink
  ],
  templateUrl: './catalog.component.html',
  styleUrls: ['../outwear/outwear.component.scss']
})
export class CatalogComponent implements OnDestroy {
  private itemService = inject(ItemService);
  items: Item[] = [];
  private itemAddedSubscription!: Subscription;

  constructor() {
    this.refreshItems();
    this.itemAddedSubscription = this.itemService.getItemAddedListener().subscribe(() => {
      this.refreshItems();
    });
  }

  refreshItems() {
    this.itemService.getItems().subscribe(items => this.items = items);
  }

  ngOnDestroy() {
    if (this.itemAddedSubscription) {
      this.itemAddedSubscription.unsubscribe();
    }
  }
}
