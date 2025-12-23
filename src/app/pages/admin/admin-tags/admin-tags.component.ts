import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../../data/services/admin-api.service';
import { ToastService } from '../../../common-ui/toast-container/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-tags.component.html',
  styleUrl: './admin-tags.component.scss'
})
export class AdminTagsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

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
          this.toast.success(this.translate.instant('admin.tags.toast_created', { name: tag }));
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.tags.toast_create_error'));
        }
      });
  }

  deleteTag(tag: string): void {
    const confirmed = globalThis.confirm(this.translate.instant('admin.tags.confirm_delete', { name: tag }));
    if (!confirmed) return;

    this.isLoading = true;
    this.adminApi.deleteTag(tag)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadTags();
          this.toast.success(this.translate.instant('admin.tags.toast_deleted', { name: tag }));
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.tags.toast_delete_error'));
        }
      });
  }
}