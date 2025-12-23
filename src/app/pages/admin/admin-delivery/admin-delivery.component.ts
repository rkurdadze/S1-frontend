import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminDeliveryZone } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-admin-delivery',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-delivery.component.html',
  styleUrl: './admin-delivery.component.scss'
})
export class AdminDeliveryComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

  zones: AdminDeliveryZone[] = [];
  selectedZone: AdminDeliveryZone | null = null;
  showCreateForm = false;
  isLoading = false;

  form: Omit<AdminDeliveryZone, 'id'> = {
    zone: '',
    price: '',
    eta: '',
    notes: ''
  };

  ngOnInit(): void {
    this.loadZones();
  }

  selectZone(zone: AdminDeliveryZone): void {
    this.selectedZone = zone;
    this.form = {
      zone: zone.zone,
      price: zone.price,
      eta: zone.eta,
      notes: zone.notes
    };
  }

  resetForm(): void {
    this.selectedZone = null;
    this.form = { zone: '', price: '', eta: '', notes: '' };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  saveZone(): void {
    if (!this.form.zone.trim()) {
      return;
    }

    this.isLoading = true;
    const payload = { ...this.form, zone: this.form.zone.trim() };
    const isUpdate = !!this.selectedZone;
    const request = isUpdate
      ? this.adminApi.updateDeliveryZone({ ...this.selectedZone!, ...payload })
      : this.adminApi.createDeliveryZone(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(isUpdate ? 'Зона доставки обновлена' : 'Зона доставки создана');
          this.resetForm();
          this.loadZones();
        },
        error: () => {
          this.toast.error('Не удалось сохранить зону доставки');
        }
      });
  }

  deleteZone(zone: AdminDeliveryZone): void {
    const confirmation = globalThis.confirm('Удалить зону доставки?');
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteDeliveryZone(zone.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Зона доставки удалена');
          if (this.selectedZone?.id === zone.id) {
            this.resetForm();
          }
          this.loadZones();
        },
        error: () => {
          this.toast.error('Не удалось удалить зону доставки');
        }
      });
  }

  private loadZones(): void {
    this.isLoading = true;

    this.adminApi
      .getDeliveryZones()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: zones => {
          this.zones = zones;
          if (this.selectedZone) {
            const updated = zones.find(item => item.id === this.selectedZone?.id);
            if (updated) {
              this.selectZone(updated);
            }
          }
        },
        error: () => {
          this.toast.error('Не удалось загрузить зоны доставки');
        }
      });
  }
}
