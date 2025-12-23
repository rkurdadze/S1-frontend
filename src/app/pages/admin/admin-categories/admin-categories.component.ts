import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminCategory } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss'
})
export class AdminCategoriesComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

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
  }

  resetForm(): void {
    this.selectedCategory = null;
    this.form = { title: '', description: '', tags: [], highlight: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  removeTag(tag: string): void {
    this.form.tags = this.form.tags.filter(t => t !== tag);
  }

  toggleTag(tag: string): void {
    if (this.form.tags.includes(tag)) {
      this.removeTag(tag);
    } else {
      this.form.tags.push(tag);
    }
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
          this.toast.success(isUpdate ? 'Категория обновлена' : 'Категория создана');
          this.resetForm();
          this.loadData();
        },
        error: () => {
          this.toast.error('Не удалось сохранить категорию');
        }
      });
  }

  deleteCategory(category: AdminCategory): void {
    const confirmation = globalThis.confirm('Удалить категорию?');
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteCategory(category.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Категория удалена');
          if (this.selectedCategory?.id === category.id) {
            this.resetForm();
          }
          this.loadData();
        },
        error: () => {
          this.toast.error('Не удалось удалить категорию');
        }
      });
  }

  private loadData(): void {
    this.isLoading = true;

    
    // Load categories and tags in parallel if possible, but sequential is fine for now
    this.adminApi.getCategories().subscribe({
      next: categories => {
        this.categories = categories;
        if (this.selectedCategory) {
          const updated = categories.find(item => item.id === this.selectedCategory?.id);
          if (updated) {
            this.selectCategory(updated);
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Не удалось загрузить категории');
        this.isLoading = false;
      }
    });

    this.adminApi.getTags().subscribe({
      next: tags => {
        this.availableTags = tags;
      }
    });
  }
}
