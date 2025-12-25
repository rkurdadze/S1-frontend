import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

import {CartService} from '../../data/services/cart.service';
import {CartItem} from '../../data/interfaces/cart-item.interface';
import {PhotoService} from '../../data/services/photo.service';
import {ContactInfo} from '../../data/interfaces/contact-info.interface';
import {OrderService} from '../../data/services/order.service';
import {OrderPayload} from '../../data/interfaces/order.interface';
import {GoogleAuthService} from '../../data/services/google-auth.service';
import {GooglePayService} from '../../data/services/google-pay.service';
import {DeliveryOption} from '../../data/interfaces/delivery-option.interface';
import {ToastService} from '../../common-ui/toast-container/toast.service';
import {DeliveryApiService} from '../../data/services/delivery-api.service';
import {
  Address,
  AddressType,
  CreateOrderDto,
  DeliveryOrder,
  PudoCity,
  PudoPoint
} from '../../data/interfaces/delivery.interface';
import {AddressModalComponent} from '../../common-ui/address-modal/address-modal.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, AddressModalComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  contactForm!: FormGroup;
  deliveryForm!: FormGroup;
  deliveryOptions: DeliveryOption[] = [
    {id: 'courier', label: 'Курьер', description: 'Доставка по городу'},
    {id: 'pickup', label: 'Самовывоз', description: 'Забрать из шоурума'},
    {id: 'express', label: 'Экспресс', description: 'Экспресс-доставка в течение дня'}
  ];
  isSubmitting = false;
  paymentError: string | null = null;
  user: any = null;
  private subscription = new Subscription();
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);

  senderAddresses: Address[] = [];
  receiverAddresses: Address[] = [];
  pudoCities: PudoCity[] = [];
  pickupPudos: PudoPoint[] = [];
  deliveryPudos: PudoPoint[] = [];
  addressModalOpen = false;
  addressModalType: AddressType = 'SENDER';
  lastDeliveryOrder?: DeliveryOrder;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private photoService: PhotoService,
    private googleAuth: GoogleAuthService,
    private googlePayService: GooglePayService,
    private deliveryApi: DeliveryApiService
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      region: [''],
      postalCode: [''],
      country: ['Georgia'],
      deliveryOption: [this.deliveryOptions[0].id, Validators.required],
      notes: ['']
    });

    this.deliveryForm = this.fb.group({
      deliveryService: ['INTERNAL', Validators.required],
      pickup_method: ['COURIER', Validators.required],
      delivery_method: ['COURIER', Validators.required],
      sender_address_id: [null],
      receiver_address_id: [null],
      pickup_city_id: [null],
      delivery_city_id: [null],
      pickup_pudo_id: [null],
      delivery_pudo_id: [null],
      sender_phone_number: ['', Validators.required],
      receiver_phone_number: ['', Validators.required],
      receiver_name: ['', Validators.required],
      weight: [0.1, [Validators.required, Validators.min(0.1)]],
      items_quantity: [1, [Validators.required, Validators.min(1)]],
      cod: [false],
      cod_amount: [null],
      payer: ['SENDER', Validators.required],
      payment_type: ['CASH', Validators.required],
      fragile: [false],
      to_have_picture: [false],
      insured: [false],
      description: [''],
      return_decision: [''],
      return_pudo_id: [null]
    });

    this.subscription.add(
      this.cartService.items$.subscribe((items) => {
        this.cartItems = items;
        const qty = items.reduce((acc, item) => acc + item.quantity, 0);
        this.deliveryForm.patchValue({ items_quantity: qty || 1 }, { emitEvent: false });
      })
    );

    this.subscription.add(
      this.googleAuth.user$.subscribe((user) => (this.user = user))
    );

    this.subscription.add(
      this.deliveryForm.get('cod')!.valueChanges.subscribe(() => this.updateCodValidators())
    );
    this.subscription.add(
      this.deliveryForm.get('pickup_method')!.valueChanges.subscribe(() => this.updatePickupValidators())
    );
    this.subscription.add(
      this.deliveryForm.get('delivery_method')!.valueChanges.subscribe(() => this.updatePickupValidators())
    );
    this.subscription.add(
      this.deliveryForm.get('pickup_city_id')!.valueChanges.subscribe(cityId => this.loadPickupPudos(cityId))
    );
    this.subscription.add(
      this.deliveryForm.get('delivery_city_id')!.valueChanges.subscribe(cityId => this.loadDeliveryPudos(cityId))
    );

    this.loadAddresses();
    this.loadPudoCities();
    this.updatePickupValidators();
    this.updateCodValidators();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get total(): number {
    return this.cartService.getTotalPrice();
  }

  get selectedService(): string {
    return this.deliveryForm.get('deliveryService')?.value;
  }

  getPhotoSrc(item: CartItem): string {
    return item.photoId ? this.photoService.getPhotoSrc(item.photoId) + '/200' : '/assets/imgs/no-image.png';
  }

  updateQuantity(item: CartItem, quantity: number): void {
    this.cartService.updateQuantity(item, quantity);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item);
  }

  clearCart(): void {
    this.cartService.clear();
  }

  private buildContactInfo(): ContactInfo {
    return {
      firstName: this.contactForm.value.firstName,
      lastName: this.contactForm.value.lastName,
      email: this.contactForm.value.email,
      phone: this.contactForm.value.phone,
      addressLine1: this.contactForm.value.addressLine1,
      addressLine2: this.contactForm.value.addressLine2,
      city: this.contactForm.value.city,
      region: this.contactForm.value.region,
      postalCode: this.contactForm.value.postalCode,
      country: this.contactForm.value.country
    };
  }

  async onGooglePay(): Promise<void> {
    this.paymentError = null;
    if (!this.user) {
      this.paymentError = 'Авторизуйтесь через Google, чтобы оплатить заказ.';
      return;
    }

    if (this.cartItems.length === 0) {
      this.paymentError = 'Корзина пуста.';
      return;
    }

    try {
      const paymentData = await this.googlePayService.pay(this.total, 'USD');
      this.submitOrder(paymentData?.paymentMethodData?.tokenizationData?.token);
    } catch (err: any) {
      this.paymentError = err?.statusCode === 'CANCELED' ? 'Оплата отменена.' : 'Не удалось завершить оплату Google Pay.';
    }
  }

  submitOrder(paymentToken?: string): void {
    if (this.selectedService === 'TRACKINGS_GE') {
      this.submitDeliveryOrder();
      return;
    }

    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      this.paymentError = 'Заполните контактные данные для доставки.';
      return;
    }

    const order: OrderPayload = {
      items: this.cartItems,
      contact: this.buildContactInfo(),
      deliveryOption: this.contactForm.value.deliveryOption || this.deliveryOptions[0].id,
      notes: this.contactForm.value.notes,
      total: this.total,
      paymentToken,
      userId: this.user?.id,
      emailNotification: true
    };

    this.isSubmitting = true;
    this.paymentError = null;
    this.orderService.createOrder(order).subscribe({
      next: () => {
        this.cartService.clear();
        this.contactForm.reset({country: 'Georgia', deliveryOption: this.deliveryOptions[0].id});
        this.toastService.success(
            this.translate('cart.order_success'),
            { autoClose: true, duration: 4000 }
        );
      },
      error: (error) => {
        console.error('Ошибка при создании заказа', error);
        this.paymentError = 'Не удалось создать заказ. Попробуйте позже.';
      },
      complete: () => (this.isSubmitting = false)
    });
  }

  submitDeliveryOrder(): void {
    if (!this.deliveryForm.valid) {
      this.deliveryForm.markAllAsTouched();
      this.paymentError = this.translate('cart.delivery_form_error');
      return;
    }

    if (this.cartItems.length === 0) {
      this.paymentError = this.translate('cart.empty.title');
      return;
    }

    const dto: CreateOrderDto = {
      ...(this.deliveryForm.value as CreateOrderDto),
      items: this.cartItems
    };

    if (!dto.cod) {
      dto.cod_amount = undefined;
    }

    this.isSubmitting = true;
    this.paymentError = null;
    this.deliveryApi.createOrder(dto).subscribe({
      next: (order) => {
        this.lastDeliveryOrder = order;
        this.toastService.success(this.translate('cart.delivery_created'));
      },
      error: () => {
        this.paymentError = this.translate('cart.delivery_failed');
      },
      complete: () => (this.isSubmitting = false)
    });
  }

  openAddressModal(type: AddressType): void {
    this.addressModalType = type;
    this.addressModalOpen = true;
  }

  onAddressSaved(address: Address): void {
    this.addressModalOpen = false;
    this.loadAddresses();
    if (address.type === 'SENDER') {
      this.deliveryForm.patchValue({ sender_address_id: address.id });
    } else {
      this.deliveryForm.patchValue({ receiver_address_id: address.id });
    }
  }

  onAddressModalClosed(): void {
    this.addressModalOpen = false;
  }

  private loadAddresses(): void {
    this.deliveryApi.listAddresses('SENDER').subscribe(addresses => (this.senderAddresses = addresses));
    this.deliveryApi.listAddresses('RECEIVER').subscribe(addresses => (this.receiverAddresses = addresses));
  }

  private loadPudoCities(): void {
    this.deliveryApi.getPudoCities().subscribe(cities => (this.pudoCities = cities));
  }

  private loadPickupPudos(cityId?: number | null): void {
    if (!cityId) {
      this.pickupPudos = [];
      return;
    }
    this.deliveryApi.getPudosByCity(Number(cityId)).subscribe(pudos => (this.pickupPudos = pudos));
  }

  private loadDeliveryPudos(cityId?: number | null): void {
    if (!cityId) {
      this.deliveryPudos = [];
      return;
    }
    this.deliveryApi.getPudosByCity(Number(cityId)).subscribe(pudos => (this.deliveryPudos = pudos));
  }

  private updateCodValidators(): void {
    const codControl = this.deliveryForm.get('cod');
    const codAmountControl = this.deliveryForm.get('cod_amount');
    if (!codControl || !codAmountControl) return;
    if (codControl.value) {
      codAmountControl.setValidators([Validators.required, Validators.min(0)]);
    } else {
      codAmountControl.clearValidators();
      codAmountControl.setValue(null);
    }
    codAmountControl.updateValueAndValidity({ emitEvent: false });
  }

  private updatePickupValidators(): void {
    const pickupMethod = this.deliveryForm.get('pickup_method');
    const deliveryMethod = this.deliveryForm.get('delivery_method');
    const senderAddress = this.deliveryForm.get('sender_address_id');
    const receiverAddress = this.deliveryForm.get('receiver_address_id');
    const pickupPudo = this.deliveryForm.get('pickup_pudo_id');
    const deliveryPudo = this.deliveryForm.get('delivery_pudo_id');

    if (pickupMethod?.value === 'COURIER') {
      senderAddress?.setValidators([Validators.required]);
      pickupPudo?.clearValidators();
    } else {
      pickupPudo?.setValidators([Validators.required]);
      senderAddress?.clearValidators();
    }

    if (deliveryMethod?.value === 'COURIER') {
      receiverAddress?.setValidators([Validators.required]);
      deliveryPudo?.clearValidators();
    } else {
      deliveryPudo?.setValidators([Validators.required]);
      receiverAddress?.clearValidators();
    }

    senderAddress?.updateValueAndValidity({ emitEvent: false });
    receiverAddress?.updateValueAndValidity({ emitEvent: false });
    pickupPudo?.updateValueAndValidity({ emitEvent: false });
    deliveryPudo?.updateValueAndValidity({ emitEvent: false });
  }

  private translate(key: string): string {
    return this.translateService.instant(key);
  }
}
