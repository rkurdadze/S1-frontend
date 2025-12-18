import { CommonModule } from '@angular/common';
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export type AvailabilityState = 'pending' | 'in' | 'low' | 'out';

@Component({
  selector: 'app-item-purchase-bar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './item-purchase-bar.component.html',
  styleUrl: './item-purchase-bar.component.scss'
})
export class ItemPurchaseBarComponent implements OnInit, OnDestroy {
  @Input() price = 0;
  @Input() compareAtPrice?: number | null;
  @Input() availabilityLabel = '';
  @Input() availabilityState: AvailabilityState = 'pending';
  @Input() quantity = 1;
  @Input() canSubmit = true;

  @Output() quantityChange = new EventEmitter<number>();
  @Output() addToCart = new EventEmitter<void>();
  @Output() buyNow = new EventEmitter<void>();

  constructor(private renderer: Renderer2) {}

  get discountPercentage(): number | null {
    if (!this.compareAtPrice || this.compareAtPrice <= this.price) {
      return null;
    }

    const discount = Math.round((1 - this.price / this.compareAtPrice) * 100);
    return discount > 0 ? discount : null;
  }

  decrease(): void {
    const next = Math.max(1, this.quantity - 1);
    this.quantityChange.emit(next);
  }

  increase(): void {
    this.quantityChange.emit(this.quantity + 1);
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'has-purchase-bar');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'has-purchase-bar');
  }
}
