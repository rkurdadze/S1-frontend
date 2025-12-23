import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminEditorial } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-editorials',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TranslateModule],
  templateUrl: './admin-editorials.component.html',
  styleUrl: './admin-editorials.component.scss'
})
export class AdminEditorialsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

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
          this.toast.success(this.translate.instant(isUpdate ? 'admin.editorials.toast_updated' : 'admin.editorials.toast_created'));
          this.resetForm();
          this.loadEditorials();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.editorials.toast_save_error'));
        }
      });
  }

  deleteEditorial(editorial: AdminEditorial): void {
    const confirmation = globalThis.confirm(this.translate.instant('admin.editorials.confirm_delete'));
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteEditorial(editorial.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant('admin.editorials.toast_deleted'));
          if (this.selectedEditorial?.id === editorial.id) {
            this.resetForm();
          }
          this.loadEditorials();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.editorials.toast_delete_error'));
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
          this.toast.error(this.translate.instant('admin.editorials.toast_load_error'));
        }
      });
  }
}
