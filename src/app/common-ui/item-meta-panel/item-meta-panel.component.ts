import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';

export interface ItemMetaBlock {
  title: string;
  subtitle: string;
  icon: string;
  accent?: string;
}

@Component({
  selector: 'app-item-meta-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-meta-panel.component.html',
  styleUrls: ['./item-meta-panel.component.scss']
})
export class ItemMetaPanelComponent {
  @Input() blocks: ItemMetaBlock[] = [
    {
      title: 'Доставка 1-3 дня',
      subtitle: 'Курьером по СНГ, самовывоз из шоурума или примерка на дому.',
      icon: '🚚'
    },
    {
      title: 'Сервис и уход',
      subtitle: 'Берегите фактуру: деликатная химчистка и хранение в чехле.',
      icon: '🧴'
    },
    {
      title: 'Устойчивость',
      subtitle: 'Материалы без пуха и меха, упаковка из переработанной бумаги.',
      icon: '♻️'
    },
    {
      title: 'Возврат 30 дней',
      subtitle: 'Примерьте дома: бесплатный возврат и обмен размеров.',
      icon: '↩️'
    }
  ];
}
