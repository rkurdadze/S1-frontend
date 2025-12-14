import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {OrderPayload} from '../interfaces/order.interface';
import {BASE_API_URL} from '../../app.config';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseApiUrl = inject(BASE_API_URL);

  constructor(private http: HttpClient) {}

  createOrder(order: OrderPayload) {
    return this.http.post(`${this.baseApiUrl}orders`, order);
  }
}
