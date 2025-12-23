import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../../data/services/admin-api.service';
import { AdminOrder } from '../../../data/interfaces/admin/admin.interfaces';
import { ToastService } from '../../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

  orders: AdminOrder[] = [];
  selectedOrder: AdminOrder | null = null;
  isLoading = false;

  form: Omit<AdminOrder, 'id'> = {
    orderNumber: '',
    customer: '',
    total: '',
    status: '',
    delivery: '',
    date: '',
    address: '',
    notes: '',
    window: ''
  };

  ngOnInit(): void {
    this.loadOrders();
  }

  selectOrder(order: AdminOrder): void {
    this.selectedOrder = order;
    this.form = {
      orderNumber: order.orderNumber,
      customer: order.customer,
      total: order.total,
      status: order.status,
      delivery: order.delivery,
      date: order.date,
      address: order.address,
      notes: order.notes,
      window: order.window
    };
  }

  resetForm(): void {
    this.selectedOrder = null;
    this.form = {
      orderNumber: '',
      customer: '',
      total: '',
      status: '',
      delivery: '',
      date: '',
      address: '',
      notes: '',
      window: ''
    };
  }

  saveOrder(): void {
    if (!this.form.orderNumber.trim()) {
      return;
    }
    if (!this.selectedOrder) {
      return;
    }

    this.isLoading = true;
    const payload: AdminOrder = { ...this.selectedOrder, ...this.form, orderNumber: this.form.orderNumber.trim() };
    this.adminApi
      .updateOrder(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Заказ обновлен');
          this.resetForm();
          this.loadOrders();
        },
        error: () => {
          this.toast.error('Не удалось обновить заказ');
        }
      });
  }

  deleteOrder(order: AdminOrder): void {
    const confirmation = globalThis.confirm('Удалить заказ?');
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteOrder(order.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.toast.success('Заказ удален');
          if (this.selectedOrder?.id === order.id) {
            this.resetForm();
          }
          this.loadOrders();
        },
        error: () => {
          this.toast.error('Не удалось удалить заказ');
        }
      });
  }

  private loadOrders(): void {
    this.isLoading = true;

    this.adminApi
      .getOrders()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: orders => {
          this.orders = orders;
          if (this.selectedOrder) {
            const updated = orders.find(item => item.id === this.selectedOrder?.id);
            if (updated) {
              this.selectOrder(updated);
            }
          }
        },
        error: () => {
          this.toast.error('Не удалось загрузить заказы');
        }
      });
  }
}
