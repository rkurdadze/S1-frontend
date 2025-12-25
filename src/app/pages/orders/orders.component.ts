import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {DeliveryApiService} from '../../data/services/delivery-api.service';
import {DeliveryOrder} from '../../data/interfaces/delivery.interface';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders: DeliveryOrder[] = [];
  selectedOrder?: DeliveryOrder;
  isLoading = false;
  isLoadingDetails = false;

  constructor(private deliveryApi: DeliveryApiService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  selectOrder(order: DeliveryOrder): void {
    if (!order.id && !order.order_id) {
      this.selectedOrder = order;
      return;
    }
    this.isLoadingDetails = true;
    this.deliveryApi.getOrder(order.id || order.order_id || '').subscribe({
      next: fullOrder => (this.selectedOrder = fullOrder),
      error: () => (this.selectedOrder = order),
      complete: () => (this.isLoadingDetails = false)
    });
  }

  refresh(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading = true;
    this.deliveryApi.listOrders().subscribe({
      next: orders => (this.orders = orders),
      complete: () => (this.isLoading = false)
    });
  }
}
