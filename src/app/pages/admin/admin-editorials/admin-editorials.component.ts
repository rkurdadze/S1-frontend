import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminEditorial } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-admin-editorials',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-editorials.component.html',
  styleUrl: './admin-editorials.component.scss'
})
export class AdminEditorialsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

  editorials: AdminEditorial[] = [];
  selectedEditorial: AdminEditorial | null = null;
  showCreateForm = false;
  isLoading = false;

  form: Omit<AdminEditorial, 'id'> = {
    title: '',
    summary: '',
    image: '',
    cta: ''
  };

  ngOnInit(): void {
    this.loadEditorials();
  }

  selectEditorial(editorial: AdminEditorial): void {
    this.selectedEditorial = editorial;
    this.form = {
      title: editorial.title,
      summary: editorial.summary,
      image: editorial.image,
      cta: editorial.cta
    };
  }

  resetForm(): void {
    this.selectedEditorial = null;
    this.form = { title: '', summary: '', image: '', cta: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  saveEditorial(): void {
    if (!this.form.title.trim()) {
      return;
    }

    this.isLoading = true;
    const payload = { ...this.form, title: this.form.title.trim() };
    const isUpdate = !!this.selectedEditorial;
    const request = isUpdate
      ? this.adminApi.updateEditorial({ ...this.selectedEditorial!, ...payload })
      : this.adminApi.createEditorial(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(isUpdate ? 'История обновлена' : 'История создана');
          this.resetForm();
          this.loadEditorials();
        },
        error: () => {
          this.toast.error('Не удалось сохранить историю');
        }
      });
  }

  deleteEditorial(editorial: AdminEditorial): void {
    const confirmation = globalThis.confirm('Удалить историю?');
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteEditorial(editorial.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('История удалена');
          if (this.selectedEditorial?.id === editorial.id) {
            this.resetForm();
          }
          this.loadEditorials();
        },
        error: () => {
          this.toast.error('Не удалось удалить историю');
        }
      });
  }

  private loadEditorials(): void {
    this.isLoading = true;

    this.adminApi
      .getEditorials()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: editorials => {
          this.editorials = editorials;
          if (this.selectedEditorial) {
            const updated = editorials.find(item => item.id === this.selectedEditorial?.id);
            if (updated) {
              this.selectEditorial(updated);
            }
          }
        },
        error: () => {
          this.toast.error('Не удалось загрузить редакционные истории');
        }
      });
  }
}
