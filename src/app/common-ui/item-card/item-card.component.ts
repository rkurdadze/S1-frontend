import {Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Item} from '../../data/interfaces/item.interface';
import {DecimalPipe, JsonPipe, NgClass, NgIf, NgStyle} from '@angular/common';
import {ItemHelpers} from '../../helpers/ItemHelpers';
import {Router} from "@angular/router";
import {BASE_API_URL} from "../../app.config";
import {environment} from "../../../environments/environment";
import {PhotoService} from "../../data/services/photo.service";
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [
    JsonPipe,
    NgStyle,
    NgClass,
    NgIf,
    DecimalPipe,
    TranslateModule
  ],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss'
})
export class ItemCardComponent implements OnChanges{
  @Input() item!: Item;
  router = inject(Router);
  isProduction = environment.production;
  private photoService = new PhotoService();

  getUniqueSizes = ItemHelpers.getUniqueSizes;
  isOutOfStock = ItemHelpers.isOutOfStock;
  isColorOutOfStock = ItemHelpers.isColorOutOfStock;
  totalStock = ItemHelpers.getTotalStock;

  getPrimaryColor(): string {
    return this.item?.colors?.[0]?.name ?? 'Цвет';
  }

  navigateToItemPage(): void {
    this.router.navigate(['/item', this.item.id]); // Navigate to item-page with item ID
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPhotoSrc(): string {
    if (!this.item?.colors?.length) {
      return '/assets/imgs/no-image.png';
    }


    let id = this.getFirstPhotoId(this.item);
    if (id)
      return this.photoService.getPhotoSrc(id) + '/400';
    else return '/assets/imgs/no-image.png';
  }

  getFirstPhotoId(item: Item): number | null {
    if (!item || !item.colors || item.colors.length === 0) {
      return null;
    }

    for (const color of item.colors) {
      if (color.photoIds && color.photoIds.length > 0) {
        return color.photoIds[0]; // Return the first photo ID found
      }
    }

    return null; // If no photo ID was found
  }


  showAllImages(): void {
    const allPhotoIds = this.item.colors.flatMap(color => color.photoIds ?? []);
    const uniquePhotoIds = [...new Set(allPhotoIds)];
    // console.log(`Уникальные фото-идентификаторы: ${uniquePhotoIds.join(', ')}`);
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] && changes['item'].currentValue) {
      this.showAllImages();
    }
  }
}
