import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {DeliveryApiService} from '../../data/services/delivery-api.service';
import {Address, AddressType, City, Region} from '../../data/interfaces/delivery.interface';

@Component({
  selector: 'app-address-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './address-modal.component.html',
  styleUrl: './address-modal.component.scss'
})
export class AddressModalComponent implements OnChanges {
  @Input() open = false;
  @Input() initialData?: Address;
  @Input() defaultType: AddressType = 'SENDER';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Address>();

  form: FormGroup;
  isSaving = false;
  regions: Region[] = [];
  cities: City[] = [];
  cityLoading = false;

  constructor(private fb: FormBuilder, private deliveryApi: DeliveryApiService) {
    this.form = this.fb.group({
      address: ['', [Validators.required, Validators.maxLength(255)]],
      type: [this.defaultType, Validators.required],
      region: [''],
      city_id: [null, Validators.required]
    });

    this.loadRegions();
    this.loadCities();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.initialData) {
      this.form.patchValue({
        address: this.initialData.address,
        type: this.initialData.type,
        city_id: this.initialData.city_id || (typeof this.initialData.city === 'object' ? this.initialData.city.id : null)
      });
    }
    if (changes['defaultType'] && !this.initialData) {
      this.form.patchValue({ type: this.defaultType });
    }
  }

  onRegionChange(regionId: string): void {
    if (!regionId) {
      this.loadCities();
      return;
    }
    this.cityLoading = true;
    this.deliveryApi.getCitiesByRegion(Number(regionId)).subscribe({
      next: cities => (this.cities = cities),
      complete: () => (this.cityLoading = false)
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    const payload = this.form.value as { address: string; type: AddressType; city_id: number };
    const request$ = this.initialData?.id
      ? this.deliveryApi.updateAddress(this.initialData.id, payload)
      : this.deliveryApi.createAddress(payload);
    request$.subscribe({
      next: address => {
        this.saved.emit(address);
        this.close();
      },
      complete: () => (this.isSaving = false),
      error: () => (this.isSaving = false)
    });
  }

  close(): void {
    this.closed.emit();
  }

  private loadRegions(): void {
    this.deliveryApi.getRegions().subscribe(regions => (this.regions = regions));
  }

  private loadCities(): void {
    this.cityLoading = true;
    this.deliveryApi.getCities().subscribe({
      next: cities => (this.cities = cities),
      complete: () => (this.cityLoading = false)
    });
  }
}
