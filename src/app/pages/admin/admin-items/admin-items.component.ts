import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Item } from '../../../data/interfaces/item.interface';
import { ItemService } from '../../../data/services/item.service';
import { EventService } from '../../../data/services/event.service';
import { ItemColorsComponent } from '../../../common-ui/item-colors/item-colors.component';
import { ItemSizesComponent } from '../../../common-ui/item-sizes/item-sizes.component';
import { PhotoService } from '../../../data/services/photo.service';
import { Color } from '../../../data/interfaces/color.interface';
import { Photo } from '../../../data/interfaces/photo.interface';
import { AdminApiService } from '../../../data/services/admin-api.service';
import {TranslateModule} from "@ngx-translate/core";
import { ToastService } from '../../../common-ui/toast-container/toast.service';

interface ItemFormState {
  name: string;
  description: string;
  publish: boolean;
  price: number;
}

interface AdminImagePreview {
  id: number;
  url: string;
}

@Component({
  selector: 'app-admin-items',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, ItemColorsComponent, ItemSizesComponent, TranslateModule],
  templateUrl: './admin-items.component.html',
  styleUrl: './admin-items.component.scss'
})
export class AdminItemsComponent implements OnInit {
  private itemService = inject(ItemService);
  private eventService = inject(EventService);
  private adminApi = inject(AdminApiService);
  private photoService = inject(PhotoService);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  items: Item[] = [];
  selectedItem: Item | null = null;
  selectedColor: string | null = null;
  isLoading = false;
  isTagsLoading = false;
  isPhotosLoading = false;
  showCreateForm = false;
  uploadQueue: Photo[] = [];
  selectedColorImages: AdminImagePreview[] = [];

  createForm: ItemFormState = {
    name: '',
    description: '',
    publish: true,
    price: 0
  };

  editForm: ItemFormState = {
    name: '',
    description: '',
    publish: false,
    price: 0
  };

  tags: string[] = [];
  selectedItemTags: string[] = [];
  createItemTags: string[] = [];

  ngOnInit(): void {
    this.loadItems();
    this.loadTags();

    this.eventService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(payload => {
        if (payload.id && this.selectedItem?.id === payload.id) {
          this.loadItem(payload.id);
        }
      });
  }

  loadItems(): void {
    this.isLoading = true;

    this.itemService
      .getItems()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: items => {
          this.items = items;
        },
        error: () => {
          this.toast.error('Не удалось загрузить товары');
        }
      });
  }

  selectItem(item: Item): void {
    if (!item.id) {
      return;
    }
    this.loadItem(item.id);
  }

  loadItem(itemId: number): void {

    this.itemService.getItem(itemId).subscribe({
      next: item => {
        this.selectedItem = item;
        this.editForm = {
          name: item.name,
          description: item.description,
          publish: item.publish,
          price: item.price
        };
        this.selectedColor = item.colors?.[0]?.name ?? null;
        this.selectedItemTags = item.tags ?? [];
        this.loadSelectedColorPhotos();
      },
      error: () => {
        this.toast.error('Не удалось загрузить данные товара');
      }
    });
  }

  onCreateItem(): void {
    const payload: Item = {
      name: this.createForm.name.trim(),
      description: this.createForm.description.trim(),
      publish: this.createForm.publish,
      price: this.createForm.price,
      colors: [],
      tags: this.createItemTags
    };

    if (!payload.name) {
      return;
    }

    this.itemService.addItem(payload).subscribe({
      next: item => {
        this.toast.success('Товар создан');
        this.createForm = { name: '', description: '', publish: true, price: 0 };
        this.createItemTags = [];
        this.loadItems();
        if (item.id) {
          this.selectItem(item);
        }
      },
      error: () => {
        this.toast.error('Не удалось создать товар');
      }
    });
  }

  onUpdateItem(): void {
    if (!this.selectedItem?.id) {
      return;
    }

    const updated: Item = {
      ...this.selectedItem,
      name: this.editForm.name.trim(),
      description: this.editForm.description.trim(),
      publish: this.editForm.publish,
      price: this.editForm.price,
      tags: this.selectedItemTags
    };

    this.itemService.save(updated).subscribe({
      next: () => {
        this.toast.success('Товар обновлен');
        this.loadItems();
        this.loadItem(updated.id!);
      },
      error: () => {
        this.toast.error('Не удалось обновить товар');
      }
    });
  }

  onDeleteItem(item?: Item): void {
    const target = item ?? this.selectedItem;
    if (!target?.id) {
      return;
    }
    const confirmation = globalThis.confirm('Удалить выбранный товар?');
    if (!confirmation) {
      return;
    }

    this.itemService.delete(target.id).subscribe({
      next: () => {
        this.toast.success('Товар удален');
        this.selectedItem = null;
        this.selectedColor = null;
        this.loadItems();
      },
      error: () => {
        this.toast.error('Не удалось удалить товар');
      }
    });
  }

  onColorSelected(color: string): void {
    this.selectedColor = color;
    this.loadSelectedColorPhotos();
  }

  toggleTag(tag: string): void {
    if (!this.selectedItem?.id) {
      return;
    }
    const current = new Set(this.selectedItemTags);
    if (current.has(tag)) {
      current.delete(tag);
    } else {
      current.add(tag);
    }
    const next = Array.from(current);

    this.isTagsLoading = true;
    this.adminApi
      .updateItemTags(this.selectedItem.id, next)
      .pipe(finalize(() => (this.isTagsLoading = false)))
      .subscribe({
        next: tags => {
          const updatedTags = tags?.length ? tags : next;
          this.selectedItemTags = updatedTags;
          if (this.selectedItem) {
            this.selectedItem.tags = updatedTags;
          }
        },
        error: () => {
          this.toast.error('Не удалось обновить теги товара');
        }
      });
  }

  toggleCreateTag(tag: string): void {
    this.createItemTags = this.updateTagSelection(this.createItemTags, tag);
  }

  isTagActive(tag: string): boolean {
    return this.selectedItemTags.includes(tag);
  }

  isCreateTagActive(tag: string): boolean {
    return this.createItemTags.includes(tag);
  }

  get selectedItemId(): number {
    return this.selectedItem?.id ?? 0;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  getColorPreviews(item: Item): Array<{ color: string; image: string | null }> {
    if (!item.colors) {
      return [];
    }
    return item.colors.map(color => ({
      color: color.name,
      image: this.getColorImage(color)
    }));
  }

  private getColorImage(color: Color): string | null {
    const photoId = color.photoIds?.[0];
    if (!photoId) {
      return null;
    }
    return this.photoService.getPhotoSrcForRes(photoId, 100);
  }

  getSelectedColorImages(): AdminImagePreview[] {
    return this.selectedColorImages;
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.selectedItem?.id || !this.selectedColor) {
      return;
    }

    const files = Array.from(input.files);
    this.uploadQueue = [];

    Promise.all(files.map(file => this.readFileAsBase64(file))).then(photos => {
      this.uploadQueue = photos;
      this.saveImages();
    });
    input.value = '';
  }

  private readFileAsBase64(file: File): Promise<Photo> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        resolve({
          name: file.name,
          image: e.target.result,
          colorName: this.selectedColor ?? undefined
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  saveImages(): void {
    if (!this.uploadQueue.length || !this.selectedItem?.id) {
      return;
    }
    this.itemService.saveImages(this.uploadQueue, this.selectedItem.id).subscribe({
      next: (response: any) => {
        this.toast.success('Изображения загружены');
        const latestId = response?.[response.length - 1]?.id;
        this.loadItem(this.selectedItem!.id!);
        if (latestId) {
          this.selectedColor = this.selectedColor ?? this.selectedItem?.colors?.[0]?.name ?? null;
        }
      },
      error: () => {
        this.toast.error('Не удалось загрузить изображения');
      }
    });
  }

  deleteImage(photoId: number): void {
    const confirmation = globalThis.confirm('Удалить изображение?');
    if (!confirmation) {
      return;
    }

    this.adminApi
      .deletePhoto(photoId)
      .pipe(finalize(() => (this.isPhotosLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Изображение удалено');
          if (this.selectedItem?.id) {
            this.loadItem(this.selectedItem.id);
          }
        },
        error: () => {
          this.toast.error('Не удалось удалить изображение');
        }
      });
  }

  private loadTags(): void {
    this.isTagsLoading = true;

    this.adminApi
      .getTags()
      .pipe(finalize(() => (this.isTagsLoading = false)))
      .subscribe({
        next: tags => {
          this.tags = tags;
        },
        error: () => {
          this.toast.error('Не удалось загрузить теги');
        }
      });
  }

  private refreshSelectedItemTags(itemId: number): void {
    this.adminApi.getItemTags(itemId).subscribe({
      next: tags => {
        this.selectedItemTags = tags;
        if (this.selectedItem) {
          this.selectedItem.tags = tags;
        }
      }
    });
  }

  private loadSelectedColorPhotos(): void {
    if (!this.selectedItem?.id || !this.selectedColor) {
      this.selectedColorImages = [];
      return;
    }
    const color = this.selectedItem.colors?.find(entry => entry.name === this.selectedColor);
    if (!color?.id) {
      this.selectedColorImages = [];
      return;
    }
    this.isPhotosLoading = true;

    this.adminApi
      .getItemColorPhotos(this.selectedItem.id, color.id)
      .pipe(finalize(() => (this.isPhotosLoading = false)))
      .subscribe({
        next: photos => {
          this.selectedColorImages = photos
            .filter(photo => typeof photo.id === 'number')
            .map(photo => ({
              id: photo.id as number,
              url: this.buildPhotoUrl(photo.image)
            }));
        },
        error: () => {

        }
      });
  }

  private buildPhotoUrl(image: string): string {
    if (!image) {
      return '';
    }
    if (image.startsWith('data:')) {
      return image;
    }
    return `data:image/jpeg;base64,${image}`;
  }

  private updateTagSelection(current: string[], tag: string): string[] {
    const next = new Set(current);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    return Array.from(next);
  }
}
