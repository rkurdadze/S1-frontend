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

  selectedColorId: number | null = null;

  getUniqueSizes = ItemHelpers.getUniqueSizes;
  isOutOfStock = ItemHelpers.isOutOfStock;
  isColorOutOfStock = ItemHelpers.isColorOutOfStock;
  totalStock = ItemHelpers.getTotalStock;

  getActiveColorId(): number | null {
    return this.selectedColorId ?? this.getDefaultColorId();
  }

  getDefaultColorId(): number | null {
    if (!this.item || !this.item.colors || this.item.colors.length === 0) {
      return null;
    }

    // Try to find the first color that actually has photos
    for (const color of this.item.colors) {
      if (color.photoIds && color.photoIds.length > 0) {
        return color.id;
      }
    }

    // Fallback to the first color if none have photos
    return this.item.colors[0].id;
  }

  getPrimaryColor(): string {
    const activeId = this.getActiveColorId();
    if (activeId !== null) {
      const color = this.item.colors.find(c => c.id === activeId);
      if (color) return color.name;
    }
    return 'Цвет';
  }

  navigateToItemPage(): void {
    const activeColorId = this.getActiveColorId();
    this.router.navigate(['/item', this.item.id], {
      queryParams: { colorId: activeColorId }
    }); // Navigate to item-page with item ID and selected color
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPhotoSrc(): string {
    const photoId = this.getDisplayPhotoId();
    if (photoId) {
      return this.photoService.getPhotoSrc(photoId) + '/400';
    }
    return '/assets/imgs/no-image.png';
  }

  getDisplayPhotoId(): number | null {
    const activeId = this.getActiveColorId();
    if (activeId !== null) {
      const selectedColor = this.item.colors.find(c => c.id === activeId);
      if (selectedColor && selectedColor.photoIds && selectedColor.photoIds.length > 0) {
        return selectedColor.photoIds[0];
      }
    }

    return null;
  }

  onColorClick(event: MouseEvent, colorId: number): void {
    if (this.item.colors.length <= 1) return;
    event.stopPropagation();
    this.selectedColorId = colorId;
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
