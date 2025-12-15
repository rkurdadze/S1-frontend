import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CartService} from '../../data/services/cart.service';
import {CartItem} from '../../data/interfaces/cart-item.interface';
import {PhotoService} from '../../data/services/photo.service';
import {ContactInfo} from '../../data/interfaces/contact-info.interface';
import {OrderService} from '../../data/services/order.service';
import {OrderPayload} from '../../data/interfaces/order.interface';
import {GoogleAuthService} from '../../data/services/google-auth.service';
import {Subscription} from 'rxjs';
import {GooglePayService} from '../../data/services/google-pay.service';
import {DeliveryOption} from '../../data/interfaces/delivery-option.interface';
import {ToastService} from "../../common-ui/toast-container/toast.service";

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  contactForm!: FormGroup;
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

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private photoService: PhotoService,
    private googleAuth: GoogleAuthService,
    private googlePayService: GooglePayService
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

    this.subscription.add(
      this.cartService.items$.subscribe((items) => (this.cartItems = items))
    );

    this.subscription.add(
      this.googleAuth.user$.subscribe((user) => (this.user = user))
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get total(): number {
    return this.cartService.getTotalPrice();
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
            `Заказ создан! Мы отправили уведомление на почту и свяжемся с вами.`,
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
}
