import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AvailabilityState } from './item-purchase-bar.component';

export interface PurchaseBarState {
  visible: boolean;
  price: number;
  compareAtPrice?: number | null;
  availabilityLabel: string;
  availabilityState: AvailabilityState;
  quantity: number;
  canSubmit: boolean;
  onQuantityChange?: (value: number) => void;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
}

const EMPTY_STATE: PurchaseBarState = {
  visible: false,
  price: 0,
  compareAtPrice: null,
  availabilityLabel: '',
  availabilityState: 'pending',
  quantity: 1,
  canSubmit: false,
};

@Injectable({ providedIn: 'root' })
export class ItemPurchaseBarService {
  private readonly stateSubject = new BehaviorSubject<PurchaseBarState>(EMPTY_STATE);
  readonly state$ = this.stateSubject.asObservable();

  setState(patch: Partial<PurchaseBarState>): void {
    const next = { ...this.stateSubject.getValue(), ...patch };
    this.stateSubject.next(next);
  }

  hide(): void {
    this.stateSubject.next(EMPTY_STATE);
  }
}
