import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminCollection } from '../../../data/interfaces/admin/admin.interfaces';

@Component({
  selector: 'app-admin-collections',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-collections.component.html',
  styleUrl: './admin-collections.component.scss'
})
export class AdminCollectionsComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  collections: AdminCollection[] = [];
  selectedCollection: AdminCollection | null = null;
  showCreateForm = false;
  isLoading = false;
  errorMessage = '';

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
    this.errorMessage = '';
    this.isLoading = true;
    const payload = { ...this.form, title: this.form.title.trim() };
    const request = this.selectedCollection
      ? this.adminApi.updateCollection({ ...this.selectedCollection, ...payload })
      : this.adminApi.createCollection(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadCollections();
        },
        error: () => {
          this.errorMessage = 'Не удалось сохранить коллекцию. Попробуйте ещё раз.';
        }
      });
  }

  deleteCollection(collection: AdminCollection): void {
    const confirmation = globalThis.confirm('Удалить коллекцию?');
    if (!confirmation) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    this.adminApi
      .deleteCollection(collection.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          if (this.selectedCollection?.id === collection.id) {
            this.resetForm();
          }
          this.loadCollections();
        },
        error: () => {
          this.errorMessage = 'Не удалось удалить коллекцию. Попробуйте ещё раз.';
        }
      });
  }

  private loadCollections(): void {
    this.isLoading = true;
    this.errorMessage = '';
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
          this.errorMessage = 'Не удалось загрузить коллекции. Попробуйте ещё раз.';
        }
      });
  }
}
