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

  items: Item[] = [];
  selectedItem: Item | null = null;
  selectedColor: string | null = null;
  isLoading = false;
  isTagsLoading = false;
  isPhotosLoading = false;
  errorMessage = '';
  tagError = '';
  photoError = '';
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
  tagInput = '';
  selectedItemTags: string[] = [];

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
    this.errorMessage = '';
    this.itemService
      .getItems()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: items => {
          this.items = items;
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить товары. Попробуйте ещё раз.';
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
    this.errorMessage = '';
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
        this.errorMessage = 'Не удалось загрузить данные товара. Попробуйте ещё раз.';
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
      tags: []
    };

    if (!payload.name) {
      return;
    }

    this.itemService.addItem(payload).subscribe({
      next: item => {
        this.createForm = { name: '', description: '', publish: true, price: 0 };
        this.loadItems();
        if (item.id) {
          this.selectItem(item);
        }
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
        this.loadItems();
        this.loadItem(updated.id!);
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
        this.selectedItem = null;
        this.selectedColor = null;
        this.loadItems();
      }
    });
  }

  onColorSelected(color: string): void {
    this.selectedColor = color;
    this.loadSelectedColorPhotos();
  }

  addTag(): void {
    const trimmed = this.tagInput.trim();
    if (!trimmed) {
      return;
    }
    this.tagError = '';
    this.isTagsLoading = true;
    this.adminApi
      .createTag(trimmed)
      .pipe(finalize(() => (this.isTagsLoading = false)))
      .subscribe({
        next: () => {
          this.tagInput = '';
          this.loadTags();
        },
        error: () => {
          this.tagError = 'Не удалось добавить тег. Попробуйте ещё раз.';
        }
      });
  }

  removeTag(tag: string): void {
    this.tagError = '';
    this.isTagsLoading = true;
    this.adminApi
      .deleteTag(tag)
      .pipe(finalize(() => (this.isTagsLoading = false)))
      .subscribe({
        next: () => {
          this.loadTags();
          if (this.selectedItem?.id) {
            this.refreshSelectedItemTags(this.selectedItem.id);
          }
        },
        error: () => {
          this.tagError = 'Не удалось удалить тег. Попробуйте ещё раз.';
        }
      });
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
    this.tagError = '';
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
          this.tagError = 'Не удалось обновить теги товара. Попробуйте ещё раз.';
        }
      });
  }

  isTagActive(tag: string): boolean {
    return this.selectedItemTags.includes(tag);
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
        const latestId = response?.[response.length - 1]?.id;
        this.loadItem(this.selectedItem!.id!);
        if (latestId) {
          this.selectedColor = this.selectedColor ?? this.selectedItem?.colors?.[0]?.name ?? null;
        }
      }
    });
  }

  deleteImage(photoId: number): void {
    const confirmation = globalThis.confirm('Удалить изображение?');
    if (!confirmation) {
      return;
    }
    this.photoError = '';
    this.isPhotosLoading = true;
    this.adminApi
      .deletePhoto(photoId)
      .pipe(finalize(() => (this.isPhotosLoading = false)))
      .subscribe({
        next: () => {
          if (this.selectedItem?.id) {
            this.loadItem(this.selectedItem.id);
          }
        },
        error: () => {
          this.photoError = 'Не удалось удалить изображение. Попробуйте ещё раз.';
        }
      });
  }

  private loadTags(): void {
    this.isTagsLoading = true;
    this.tagError = '';
    this.adminApi
      .getTags()
      .pipe(finalize(() => (this.isTagsLoading = false)))
      .subscribe({
        next: tags => {
          this.tags = tags;
        },
        error: () => {
          this.tagError = 'Не удалось загрузить теги. Попробуйте ещё раз.';
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
    this.photoError = '';
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
          this.photoError = 'Не удалось загрузить изображения. Попробуйте ещё раз.';
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
}
