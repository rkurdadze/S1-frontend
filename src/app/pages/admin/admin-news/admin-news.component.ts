import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminNewsItem } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TranslateModule],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.scss'
})
export class AdminNewsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  news: AdminNewsItem[] = [];
  selectedNews: AdminNewsItem | null = null;
  showCreateForm = false;
  isLoading = false;

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
    this.isLoading = true;
    const payload = { ...this.form, title: this.form.title.trim() };
    const isUpdate = !!this.selectedNews;
    const request = isUpdate
      ? this.adminApi.updateNews({ ...this.selectedNews!, ...payload })
      : this.adminApi.createNews(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant(isUpdate ? 'admin.news.toast_updated' : 'admin.news.toast_created'));
          this.resetForm();
          this.loadNews();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.news.toast_save_error'));
        }
      });
  }

  deleteNews(item: AdminNewsItem): void {
    const confirmation = globalThis.confirm(this.translate.instant('admin.news.confirm_delete'));
    if (!confirmation) {
      return;
    }
    this.isLoading = true;
    this.adminApi
      .deleteNews(item.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant('admin.news.toast_deleted'));
          if (this.selectedNews?.id === item.id) {
            this.resetForm();
          }
          this.loadNews();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.news.toast_delete_error'));
        }
      });
  }

  private loadNews(): void {
    this.isLoading = true;
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
          this.toast.error(this.translate.instant('admin.news.toast_load_error'));
        }
      });
  }
}
