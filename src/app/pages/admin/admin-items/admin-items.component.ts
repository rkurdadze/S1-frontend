import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
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
import {TranslateModule, TranslateService} from "@ngx-translate/core";
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
  imports: [NgFor, NgIf, NgTemplateOutlet, FormsModule, ItemColorsComponent, ItemSizesComponent, TranslateModule],
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
  private translate = inject(TranslateService);

  items: Item[] = [];
  selectedItem: Item | null = null;
  selectedColor: string | null = null;
  editingItemId: number | null = null;
  searchTerm = '';
  isLoading = false;
  isTagsLoading = false;
  isPhotosLoading = false;
  showCreateForm = false;
  draftItemId: number | null = null;
  uploadQueue: Photo[] = [];
  selectedColorImages: AdminImagePreview[] = [];

  itemForm: ItemFormState = {
    name: '',
    description: '',
    publish: false,
    price: 0
  };

  tags: string[] = [];
  activeItemTags: string[] = [];

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
        next: items => this.items = items,
        error: () => this.toast.error(this.translate.instant('admin.items.toast_load_error'))
      });
  }

  startEdit(item: Item): void {
    if (!item.id) return;
    this.editingItemId = item.id;
    this.loadItem(item.id);
  }

  cancelEdit(): void {
    if (this.draftItemId && this.selectedItem?.id === this.draftItemId) {
      this.onDeleteItem(this.selectedItem, true);
    }
    this.editingItemId = null;
    this.selectedItem = null;
    this.selectedColor = null;
    this.selectedColorImages = [];
    this.draftItemId = null;
    this.showCreateForm = false;
  }

  loadItem(itemId: number): void {
    this.itemService.getItem(itemId).subscribe({
      next: item => {
        this.selectedItem = item;
        this.itemForm = {
          name: item.name,
          description: item.description,
          publish: item.publish,
          price: item.price
        };
        this.selectedColor = item.colors?.[0]?.name ?? null;
        this.activeItemTags = item.tags ?? [];
        this.loadSelectedColorPhotos();
      },
      error: () => this.toast.error(this.translate.instant('admin.items.toast_load_error'))
    });
  }

  toggleCreateForm(): void {
    if (!this.showCreateForm) {
      this.onCreateItem();
    } else {
      this.cancelEdit();
    }
  }

  onCreateItem(): void {
    const payload: Item = {
      name: this.translate.instant('admin.items.new_card'),
      description: '',
      publish: false,
      price: 0,
      colors: [],
      tags: []
    };

    this.itemService.addItem(payload).subscribe({
      next: item => {
        this.draftItemId = item.id ?? null;
        this.showCreateForm = true;
        this.selectedItem = item;
        this.editingItemId = item.id ?? null;
        this.itemForm = { name: '', description: '', publish: false, price: 0 };
        this.activeItemTags = [];
        this.selectedColor = null;
        this.selectedColorImages = [];
      },
      error: () => this.toast.error(this.translate.instant('admin.items.toast_create_error'))
    });
  }

  onSaveItem(): void {
    if (!this.selectedItem?.id) return;

    const updated: Item = {
      ...this.selectedItem,
      name: this.itemForm.name.trim(),
      description: this.itemForm.description.trim(),
      publish: this.itemForm.publish,
      price: this.itemForm.price,
      tags: this.activeItemTags
    };

    if (!updated.name) return;

    const isNew = this.selectedItem.id === this.draftItemId;

    this.itemService.save(updated).subscribe({
      next: () => {
        this.toast.success(this.translate.instant(isNew ? 'admin.items.toast_created' : 'admin.items.toast_updated'));
        this.draftItemId = null;
        this.showCreateForm = false;
        this.editingItemId = null;
        this.selectedItem = null;
        this.loadItems();
      },
      error: () => this.toast.error(this.translate.instant(isNew ? 'admin.items.toast_create_error' : 'admin.items.toast_update_error'))
    });
  }

  onDeleteItem(item?: Item, silent = false): void {
    const target = item ?? this.selectedItem;
    if (!target?.id) return;

    if (!silent) {
      const confirmation = globalThis.confirm(this.translate.instant('admin.items.confirm_delete'));
      if (!confirmation) return;
    }

    this.itemService.delete(target.id).subscribe({
      next: () => {
        if (!silent) this.toast.success(this.translate.instant('admin.items.toast_deleted'));
        if (this.selectedItem?.id === target.id) {
          this.selectedItem = null;
          this.selectedColor = null;
          this.editingItemId = null;
        }
        this.loadItems();
      },
      error: () => {
        if (!silent) this.toast.error(this.translate.instant('admin.items.toast_delete_error'));
      }
    });
  }

  onColorSelected(color: string): void {
    this.selectedColor = color;
    this.loadSelectedColorPhotos();
  }

  toggleTag(tag: string): void {
    const current = new Set(this.activeItemTags);
    current.has(tag) ? current.delete(tag) : current.add(tag);
    this.activeItemTags = Array.from(current);
  }

  isTagActive(tag: string): boolean {
    return this.activeItemTags.includes(tag);
  }

  get filteredItems(): Item[] {
    const term = this.searchTerm.trim().toLowerCase();
    const list = this.items.filter(item => item.id !== this.draftItemId);
    if (!term) return list;
    return list.filter(item => {
      const parts = [item.name, item.description, item.tags?.join(' '), item.id?.toString()].filter(Boolean) as string[];
      return parts.join(' ').toLowerCase().includes(term);
    });
  }

  getColorPreviews(item: Item): Array<{ color: string; image: string | null }> {
    return (item.colors ?? []).map(color => ({
      color: color.name,
      image: color.photoIds?.[0] ? this.photoService.getPhotoSrcForRes(color.photoIds[0], 100) : null
    }));
  }

  getSelectedColorImages(): AdminImagePreview[] {
    return this.selectedColorImages;
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.selectedItem?.id || !this.selectedColor) return;

    Promise.all(Array.from(input.files).map(file => this.readFileAsBase64(file))).then(photos => {
      this.uploadQueue = photos;
      this.saveImages();
    });
    input.value = '';
  }

  private readFileAsBase64(file: File): Promise<Photo> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve({ name: file.name, image: e.target.result, colorName: this.selectedColor ?? undefined });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  saveImages(): void {
    if (!this.uploadQueue.length || !this.selectedItem?.id) return;
    this.itemService.saveImages(this.uploadQueue, this.selectedItem.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('admin.items.toast_photos_uploaded'));
        this.loadItem(this.selectedItem!.id!);
      },
      error: () => this.toast.error(this.translate.instant('admin.items.toast_photos_upload_error'))
    });
  }

  deleteImage(photoId: number): void {
    if (!globalThis.confirm(this.translate.instant('admin.items.confirm_delete_image'))) return;
    this.adminApi.deletePhoto(photoId).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('admin.items.toast_photo_deleted'));
        if (this.selectedItem?.id) this.loadItem(this.selectedItem.id);
      },
      error: () => this.toast.error(this.translate.instant('admin.items.toast_photo_delete_error'))
    });
  }

  private loadTags(): void {
    this.adminApi.getTags().subscribe({
      next: tags => this.tags = tags,
      error: () => this.toast.error(this.translate.instant('admin.items.toast_load_tags_error'))
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
    this.adminApi.getItemColorPhotos(this.selectedItem.id, color.id)
      .pipe(finalize(() => this.isPhotosLoading = false))
      .subscribe({
        next: photos => this.selectedColorImages = photos.filter(p => typeof p.id === 'number').map(p => ({ id: p.id as number, url: this.buildPhotoUrl(p.image) }))
      });
  }

  private buildPhotoUrl(image: string): string {
    return image?.startsWith('data:') ? image : (image ? `data:image/jpeg;base64,${image}` : '');
  }
}
