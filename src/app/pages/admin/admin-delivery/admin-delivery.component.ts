import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminDeliveryZone } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {DeliveryServiceSetting} from '../../../data/interfaces/delivery.interface';
import {AdminDeliverySettingsService} from '../../../data/services/admin-delivery-settings.service';
import {EventService} from '../../../data/services/event.service';

@Component({
  selector: 'app-admin-delivery',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TranslateModule],
  templateUrl: './admin-delivery.component.html',
  styleUrl: './admin-delivery.component.scss'
})
export class AdminDeliveryComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private deliverySettingsApi = inject(AdminDeliverySettingsService);
  private eventService = inject(EventService);

  zones: AdminDeliveryZone[] = [];
  selectedZone: AdminDeliveryZone | null = null;
  showCreateForm = false;
  isLoading = false;
  isLoadingSettings = false;
  isSavingSettings = false;
  serviceSettings: DeliveryServiceSetting[] = [
    { service: 'INTERNAL', enabled: true },
    { service: 'TRACKINGS_GE', enabled: false }
  ];

  form: Omit<AdminDeliveryZone, 'id'> = {
    zone: '',
    price: '',
    eta: '',
    notes: ''
  };

  ngOnInit(): void {
    this.loadZones();
    this.loadServiceSettings();
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
          this.toast.success(this.translate.instant(isUpdate ? 'admin.delivery.toast_updated' : 'admin.delivery.toast_created'));
          this.resetForm();
          this.loadZones();
          this.eventService.emitRefreshAdmin();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.delivery.toast_save_error'));
        }
      });
  }

  deleteZone(zone: AdminDeliveryZone): void {
    const confirmation = globalThis.confirm(this.translate.instant('admin.delivery.confirm_delete'));
    if (!confirmation) {
      return;
    }
    this.isLoading = true;
    this.adminApi
      .deleteDeliveryZone(zone.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.translate.instant('admin.delivery.toast_deleted'));
          if (this.selectedZone?.id === zone.id) {
            this.resetForm();
          }
          this.loadZones();
          this.eventService.emitRefreshAdmin();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.delivery.toast_delete_error'));
        }
      });
  }

  toggleService(setting: DeliveryServiceSetting): void {
    setting.enabled = !setting.enabled;
  }

  saveSettings(): void {
    this.isSavingSettings = true;
    this.deliverySettingsApi
      .saveSettings(this.serviceSettings)
      .pipe(finalize(() => (this.isSavingSettings = false)))
      .subscribe({
        next: settings => {
          this.serviceSettings = settings;
          this.toast.success(this.translate.instant('admin.delivery.settings_saved'));
          this.eventService.emitRefreshAdmin();
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.delivery.settings_error'));
        }
      });
  }

  private loadServiceSettings(): void {
    this.isLoadingSettings = true;
    this.deliverySettingsApi
      .getSettings()
      .pipe(finalize(() => (this.isLoadingSettings = false)))
      .subscribe({
        next: settings => {
          if (settings?.length) {
            this.serviceSettings = settings;
          }
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.delivery.settings_error'));
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
          this.toast.error(this.translate.instant('admin.delivery.toast_load_error'));
        }
      });
  }
}
