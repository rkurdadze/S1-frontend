import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {CartItem} from '../interfaces/cart-item.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private storageKey = 's1-cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  readonly items$ = this.cartItemsSubject.asObservable();

  addItem(newItem: CartItem): void {
    const items = [...this.cartItemsSubject.getValue()];
    const existingIndex = items.findIndex(
      (i) => i.itemId === newItem.itemId && i.colorName === newItem.colorName && i.sizeName === newItem.sizeName
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += newItem.quantity;
    } else {
      items.push({...newItem});
    }

    this.persist(items);
  }

  updateQuantity(item: CartItem, quantity: number): void {
    const safeQuantity = quantity > 0 ? quantity : 1;
    const items = this.cartItemsSubject.getValue().map((cartItem) =>
      cartItem.itemId === item.itemId && cartItem.colorName === item.colorName && cartItem.sizeName === item.sizeName
        ? {...cartItem, quantity: safeQuantity}
        : cartItem
    );
    this.persist(items);
  }

  removeItem(item: CartItem): void {
    const items = this.cartItemsSubject
      .getValue()
      .filter((cartItem) => !(cartItem.itemId === item.itemId && cartItem.colorName === item.colorName && cartItem.sizeName === item.sizeName));
    this.persist(items);
  }

  clear(): void {
    this.persist([]);
  }

  getTotalPrice(): number {
    return this.cartItemsSubject.getValue().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getTotalQuantity(): number {
    return this.cartItemsSubject.getValue().reduce((sum, item) => sum + item.quantity, 0);
  }

  private persist(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.cartItemsSubject.next(items);
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch (e) {
      console.warn('Не удалось прочитать корзину из localStorage', e);
      return [];
    }
  }
}
