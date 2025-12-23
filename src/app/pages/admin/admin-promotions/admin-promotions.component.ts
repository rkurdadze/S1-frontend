import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminPromotion } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-admin-promotions',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-promotions.component.html',
  styleUrl: './admin-promotions.component.scss'
})
export class AdminPromotionsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

  promotions: AdminPromotion[] = [];
  selectedPromotion: AdminPromotion | null = null;
  showCreateForm = false;
  isLoading = false;

  form: Omit<AdminPromotion, 'id'> = {
    name: '',
    scope: '',
    discount: '',
    period: '',
    status: ''
  };

  ngOnInit(): void {
    this.loadPromotions();
  }

  selectPromotion(promotion: AdminPromotion): void {
    this.selectedPromotion = promotion;
    this.form = {
      name: promotion.name,
      scope: promotion.scope,
      discount: promotion.discount,
      period: promotion.period,
      status: promotion.status
    };
  }

  resetForm(): void {
    this.selectedPromotion = null;
    this.form = { name: '', scope: '', discount: '', period: '', status: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  savePromotion(): void {
    if (!this.form.name.trim()) {
      return;
    }

    this.isLoading = true;
    const payload = { ...this.form, name: this.form.name.trim() };
    const isUpdate = !!this.selectedPromotion;
    const request = isUpdate
      ? this.adminApi.updatePromotion({ ...this.selectedPromotion!, ...payload })
      : this.adminApi.createPromotion(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(isUpdate ? 'Акция обновлена' : 'Акция создана');
          this.resetForm();
          this.loadPromotions();
        },
        error: () => {
          this.toast.error('Не удалось сохранить акцию');
        }
      });
  }

  deletePromotion(promotion: AdminPromotion): void {
    const confirmation = globalThis.confirm('Удалить акцию?');
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deletePromotion(promotion.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Акция удалена');
          if (this.selectedPromotion?.id === promotion.id) {
            this.resetForm();
          }
          this.loadPromotions();
        },
        error: () => {
          this.toast.error('Не удалось удалить акцию');
        }
      });
  }

  private loadPromotions(): void {
    this.isLoading = true;

    this.adminApi
      .getPromotions()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: promotions => {
          this.promotions = promotions;
          if (this.selectedPromotion) {
            const updated = promotions.find(item => item.id === this.selectedPromotion?.id);
            if (updated) {
              this.selectPromotion(updated);
            }
          }
        },
        error: () => {
          this.toast.error('Не удалось загрузить акции');
        }
      });
  }
}
