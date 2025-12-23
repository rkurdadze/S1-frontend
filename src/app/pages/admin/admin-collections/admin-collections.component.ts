import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminCollection } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-collections',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TranslateModule],
  templateUrl: './admin-collections.component.html',
  styleUrl: './admin-collections.component.scss'
})
export class AdminCollectionsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  collections: AdminCollection[] = [];
  selectedCollection: AdminCollection | null = null;
  showCreateForm = false;
  isLoading = false;

  form: Omit<AdminCollection, 'id'> = {
    title: '',
    tag: '',
    description: '',
    image: '',
    anchor: ''
  };

  ngOnInit(): void {
    this.loadCollections();
  }

  selectCollection(collection: AdminCollection): void {
    this.selectedCollection = collection;
    this.form = {
      title: collection.title,
      tag: collection.tag,
      description: collection.description,
      image: collection.image,
      anchor: collection.anchor
    };
  }

  resetForm(): void {
    this.selectedCollection = null;
    this.form = { title: '', tag: '', description: '', image: '', anchor: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  saveCollection(): void {
    if (!this.form.title.trim()) {
      return;
    }

    this.isLoading = true;
    const payload = { ...this.form, title: this.form.title.trim() };
    const isUpdate = !!this.selectedCollection;
    const request = isUpdate
      ? this.adminApi.updateCollection({ ...this.selectedCollection!, ...payload })
      : this.adminApi.createCollection(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant(isUpdate ? 'admin.collections.toast_updated' : 'admin.collections.toast_created'));
          this.resetForm();
          this.loadCollections();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.collections.toast_save_error'));
        }
      });
  }

  deleteCollection(collection: AdminCollection): void {
    const confirmation = globalThis.confirm(this.translate.instant('admin.collections.confirm_delete'));
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteCollection(collection.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant('admin.collections.toast_deleted'));
          if (this.selectedCollection?.id === collection.id) {
            this.resetForm();
          }
          this.loadCollections();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.collections.toast_delete_error'));
        }
      });
  }

  private loadCollections(): void {
    this.isLoading = true;

    this.adminApi
      .getCollections()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: collections => {
          this.collections = collections;
          if (this.selectedCollection) {
            const updated = collections.find(item => item.id === this.selectedCollection?.id);
            if (updated) {
              this.selectCollection(updated);
            }
          }
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.collections.toast_load_error'));
        }
      });
  }
}
