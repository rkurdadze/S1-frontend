import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminNewsItem } from '../../../data/interfaces/admin/admin.interfaces';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.scss'
})
export class AdminNewsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  news: AdminNewsItem[] = [];
  selectedNews: AdminNewsItem | null = null;
  showCreateForm = false;
  isLoading = false;
  errorMessage = '';

  form: Omit<AdminNewsItem, 'id'> = {
    title: '',
    date: '',
    summary: '',
    image: ''
  };

  ngOnInit(): void {
    this.loadNews();
  }

  selectNews(item: AdminNewsItem): void {
    this.selectedNews = item;
    this.form = {
      title: item.title,
      date: item.date,
      summary: item.summary,
      image: item.image
    };
  }

  resetForm(): void {
    this.selectedNews = null;
    this.form = { title: '', date: '', summary: '', image: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  saveNews(): void {
    if (!this.form.title.trim()) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    const payload = { ...this.form, title: this.form.title.trim() };
    const request = this.selectedNews
      ? this.adminApi.updateNews({ ...this.selectedNews, ...payload })
      : this.adminApi.createNews(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadNews();
        },
        error: () => {
          this.errorMessage = 'Не удалось сохранить новость. Попробуйте ещё раз.';
        }
      });
  }

  deleteNews(item: AdminNewsItem): void {
    const confirmation = globalThis.confirm('Удалить новость?');
    if (!confirmation) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    this.adminApi
      .deleteNews(item.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          if (this.selectedNews?.id === item.id) {
            this.resetForm();
          }
          this.loadNews();
        },
        error: () => {
          this.errorMessage = 'Не удалось удалить новость. Попробуйте ещё раз.';
        }
      });
  }

  private loadNews(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminApi
      .getNews()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: news => {
          this.news = news;
          if (this.selectedNews) {
            const updated = news.find(item => item.id === this.selectedNews?.id);
            if (updated) {
              this.selectNews(updated);
            }
          }
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить новости. Попробуйте ещё раз.';
        }
      });
  }
}
