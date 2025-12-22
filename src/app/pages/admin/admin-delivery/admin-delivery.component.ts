import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminDeliveryZone } from '../../../data/interfaces/admin/admin.interfaces';

@Component({
  selector: 'app-admin-delivery',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-delivery.component.html',
  styleUrl: './admin-delivery.component.scss'
})
export class AdminDeliveryComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  zones: AdminDeliveryZone[] = [];
  selectedZone: AdminDeliveryZone | null = null;
  showCreateForm = false;
  isLoading = false;
  errorMessage = '';

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
    this.errorMessage = '';
    this.isLoading = true;
    const payload = { ...this.form, zone: this.form.zone.trim() };
    const request = this.selectedZone
      ? this.adminApi.updateDeliveryZone({ ...this.selectedZone, ...payload })
      : this.adminApi.createDeliveryZone(payload);
    request
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadZones();
        },
        error: () => {
          this.errorMessage = 'Не удалось сохранить зону доставки. Попробуйте ещё раз.';
        }
      });
  }

  deleteZone(zone: AdminDeliveryZone): void {
    const confirmation = globalThis.confirm('Удалить зону доставки?');
    if (!confirmation) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    this.adminApi
      .deleteDeliveryZone(zone.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          if (this.selectedZone?.id === zone.id) {
            this.resetForm();
          }
          this.loadZones();
        },
        error: () => {
          this.errorMessage = 'Не удалось удалить зону доставки. Попробуйте ещё раз.';
        }
      });
  }

  private loadZones(): void {
    this.isLoading = true;
    this.errorMessage = '';
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
          this.errorMessage = 'Не удалось загрузить зоны доставки. Попробуйте ещё раз.';
        }
      });
  }
}
