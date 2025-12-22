import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminCategory } from '../../../data/interfaces/admin/admin.interfaces';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss'
})
export class AdminCategoriesComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  categories: AdminCategory[] = [];
  selectedCategory: AdminCategory | null = null;
  showCreateForm = false;
  isLoading = false;
  errorMessage = '';

  form: Omit<AdminCategory, 'id'> = {
    title: '',
    description: '',
    items: 0,
    highlight: ''
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  selectCategory(category: AdminCategory): void {
    this.selectedCategory = category;
    this.form = {
      title: category.title,
      description: category.description,
      items: category.items,
      highlight: category.highlight
    };
  }

  resetForm(): void {
    this.selectedCategory = null;
    this.form = { title: '', description: '', items: 0, highlight: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  saveCategory(): void {
    if (!this.form.title.trim()) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    const payload = { ...this.form, title: this.form.title.trim() };
    const request = this.selectedCategory
      ? this.adminApi.updateCategory({ ...this.selectedCategory, ...payload })
      : this.adminApi.createCategory(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadCategories();
        },
        error: () => {
          this.errorMessage = 'Не удалось сохранить категорию. Попробуйте ещё раз.';
        }
      });
  }

  deleteCategory(category: AdminCategory): void {
    const confirmation = globalThis.confirm('Удалить категорию?');
    if (!confirmation) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    this.adminApi
      .deleteCategory(category.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          if (this.selectedCategory?.id === category.id) {
            this.resetForm();
          }
          this.loadCategories();
        },
        error: () => {
          this.errorMessage = 'Не удалось удалить категорию. Попробуйте ещё раз.';
        }
      });
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminApi
      .getCategories()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: categories => {
          this.categories = categories;
          if (this.selectedCategory) {
            const updated = categories.find(item => item.id === this.selectedCategory?.id);
            if (updated) {
              this.selectCategory(updated);
            }
          }
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить категории. Попробуйте ещё раз.';
        }
      });
  }
}
