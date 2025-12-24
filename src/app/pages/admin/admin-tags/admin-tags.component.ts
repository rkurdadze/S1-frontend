import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { AdminApiService } from '../../../data/services/admin-api.service';
import { ItemService } from '../../../data/services/item.service';
import { ToastService } from '../../../common-ui/toast-container/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../data/services/event.service';

@Component({
  selector: 'app-admin-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-tags.component.html',
  styleUrl: './admin-tags.component.scss'
})
export class AdminTagsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private itemService = inject(ItemService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private eventService = inject(EventService);

  tags: string[] = [];
  filteredTags: string[] = [];
  newTag = '';
  
  isLoading = false;

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.isLoading = true;
    this.adminApi.getTags()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (tags) => {
          this.tags = tags || [];
          this.filterTags();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.tags.toast_load_error'));
        }
      });
  }

  filterTags(): void {
    const query = this.newTag.trim().toLowerCase();
    if (!query) {
      this.filteredTags = [...this.tags];
      return;
    }
    this.filteredTags = this.tags.filter(tag => tag.toLowerCase().includes(query));
  }

  get isDuplicate(): boolean {
    const tag = this.newTag.trim().toLowerCase();
    if (!tag) return false;
    return this.tags.some(t => t.toLowerCase() === tag);
  }

  get canAddTag(): boolean {
    const tag = this.newTag.trim();
    return !!tag && !this.isDuplicate && !this.isLoading;
  }

  addTag(): void {
    if (!this.canAddTag) return;
    
    const tag = this.newTag.trim();
    this.isLoading = true;
    this.adminApi.createTag(tag)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.newTag = '';
          this.loadTags();
          this.eventService.emitRefreshAdmin();
          this.toast.success(this.translate.instant('admin.tags.toast_created', { name: tag }));
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.tags.toast_create_error'));
        }
      });
  }

  deleteTag(tag: string): void {
    this.isLoading = true;

    forkJoin({
      items: this.itemService.getItems(),
      categories: this.adminApi.getCategories()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe(({ items, categories }) => {
      const relatedItems = items.filter(i => i.tags?.includes(tag));
      const relatedCategories = categories.filter(c => c.tags?.includes(tag));
      const totalUsage = relatedItems.length + relatedCategories.length;

      const actions = [
        {
          label: this.translate.instant('admin.tags.button_delete'),
          danger: true,
          callback: () => this.performCascadingDelete(tag, relatedItems, relatedCategories)
        },
        {
          label: this.translate.instant('admin.tags.button_cancel'),
          callback: () => {}
        }
      ];

      if (totalUsage > 0) {
        this.toast.warning(
          this.translate.instant('admin.tags.confirm_delete_used', { name: tag, count: totalUsage }),
          { autoClose: false, actions }
        );
      } else {
        this.toast.info(
          this.translate.instant('admin.tags.confirm_delete', { name: tag }),
          { autoClose: false, actions }
        );
      }
    });
  }

  private performCascadingDelete(tag: string, relatedItems: any[], relatedCategories: any[]): void {
    this.isLoading = true;
    
    const itemUpdates = relatedItems.map(item => {
      const updatedTags = (item.tags || []).filter((t: string) => t !== tag);
      return this.adminApi.updateItemTags(item.id, updatedTags);
    });

    const categoryUpdates = relatedCategories.map(cat => {
      const updatedCategory = {
        ...cat,
        tags: (cat.tags || []).filter((t: string) => t !== tag)
      };
      return this.adminApi.updateCategory(updatedCategory);
    });

    const allUpdates = [...itemUpdates, ...categoryUpdates];

    if (allUpdates.length > 0) {
      forkJoin(allUpdates).subscribe({
        next: () => this.executeDelete(tag),
        error: () => {
          this.isLoading = false;
          this.toast.error(this.translate.instant('admin.tags.toast_delete_error'));
        }
      });
    } else {
      this.executeDelete(tag);
    }
  }

  private executeDelete(tag: string): void {
    this.isLoading = true;
    this.adminApi.deleteTag(tag)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.adminApi.getTags(true).subscribe((updatedTags) => {
            this.tags = updatedTags || [];
            this.filterTags();
            this.eventService.emitRefreshAdmin();
            this.toast.success(this.translate.instant('admin.tags.toast_deleted', { name: tag }));
          });
        },
        error: (err) => {
          const msg = (err.status === 409 || err.status === 400) 
            ? 'admin.tags.toast_delete_error_used' 
            : 'admin.tags.toast_delete_error';
          this.toast.error(this.translate.instant(msg));
        }
      });
  }
}