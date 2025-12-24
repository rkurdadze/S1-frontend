import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminCategory } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../data/services/event.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [NgFor, NgIf, NgTemplateOutlet, FormsModule, TranslateModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss'
})
export class AdminCategoriesComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private eventService = inject(EventService);

  categories: AdminCategory[] = [];
  availableTags: string[] = [];
  selectedCategory: AdminCategory | null = null;
  showCreateForm = false;
  isLoading = false;

  form: Omit<AdminCategory, 'id'> = {
    title: '',
    description: '',
    tags: [],
    highlight: ''
  };

  ngOnInit(): void {
    this.loadData();
  }

  selectCategory(category: AdminCategory): void {
    this.selectedCategory = category;
    this.form = {
      title: category.title || '',
      description: category.description || '',
      tags: category.tags ? [...category.tags] : [],
      highlight: category.highlight || ''
    };
    this.showCreateForm = false;
  }

  cancelEdit(): void {
    this.selectedCategory = null;
    this.showCreateForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.form = { title: '', description: '', tags: [], highlight: '' };
  }

  toggleCreateForm(): void {
    if (!this.showCreateForm) {
      this.resetForm();
      this.selectedCategory = null;
      this.showCreateForm = true;
    } else {
      this.showCreateForm = false;
    }
  }

  toggleTag(tag: string): void {
    const current = new Set(this.form.tags);
    current.has(tag) ? current.delete(tag) : current.add(tag);
    this.form.tags = Array.from(current);
  }

  isTagActive(tag: string): boolean {
    return this.form.tags.includes(tag);
  }

  saveCategory(): void {
    if (!this.form.title.trim()) {
      return;
    }
    this.isLoading = true;
    const payload = { ...this.form, title: this.form.title.trim() };
    const isUpdate = !!this.selectedCategory;
    
    const request = isUpdate
      ? this.adminApi.updateCategory({ ...this.selectedCategory!, ...payload })
      : this.adminApi.createCategory(payload);

    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant(isUpdate ? 'admin.categories.toast_updated' : 'admin.categories.toast_created'));
          this.cancelEdit();
          this.loadData();
          this.eventService.emitRefreshAdmin();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.categories.toast_save_error'));
        }
      });
  }

  deleteCategory(category: AdminCategory): void {
    const confirmation = globalThis.confirm(this.translate.instant('admin.categories.confirm_delete'));
    if (!confirmation) return;

    this.isLoading = true;
    this.adminApi.deleteCategory(category.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant('admin.categories.toast_deleted'));
          if (this.selectedCategory?.id === category.id) {
            this.cancelEdit();
          }
          this.loadData();
          this.eventService.emitRefreshAdmin();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.categories.toast_delete_error'));
        }
      });
  }

  private loadData(): void {
    this.isLoading = true;
    this.adminApi.getCategories().subscribe({
      next: categories => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('admin.categories.toast_load_error'));
        this.isLoading = false;
      }
    });

    this.adminApi.getTags().subscribe({
      next: tags => this.availableTags = tags
    });
  }
}