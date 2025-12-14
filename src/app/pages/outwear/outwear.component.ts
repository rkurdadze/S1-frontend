import {Component, inject, OnDestroy} from '@angular/core';
import {ItemCardComponent} from '../../common-ui/item-card/item-card.component';
import {Item} from '../../data/interfaces/item.interface';
import {ItemService} from '../../data/services/item.service';
import {JsonPipe, NgFor, NgIf} from '@angular/common';
import {Subscription} from "rxjs";

interface CollectionCard {
  title: string;
  description: string;
  tag: string;
  image: string;
  anchor: string;
}

interface EditorialStory {
  title: string;
  summary: string;
  image: string;
  cta: string;
}

@Component({
  selector: 'app-outwear',
  standalone: true,
  imports: [
    ItemCardComponent,
    JsonPipe,
    NgFor,
    NgIf
  ],
  templateUrl: './outwear.component.html',
  styleUrl: './outwear.component.scss'
})
export class OutwearComponent implements OnDestroy {
  itemService = inject(ItemService);
  items: Item[] = [];
  private itemAddedSubscription!: Subscription;

  highlightCollections: CollectionCard[] = [
    {
      title: 'Scandi Minimal',
      description: 'Чистые линии, матовые фактуры и акцент на функциональность в холодном сезоне.',
      tag: 'New Drop',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
      anchor: '#new-drop'
    },
    {
      title: 'City Armor',
      description: 'Монохромные пуховики и парки, рассчитанные на ветреные будни мегаполиса.',
      tag: 'Urban Line',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
      anchor: '#collections'
    },
    {
      title: 'Weekend Escape',
      description: 'Лимитированная капсула для путешествий: непромокаемые ткани, съёмные капюшоны, молнии Aquaguard.',
      tag: 'Limited',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
      anchor: '#lookbook'
    }
  ];

  lookbookFrames = [
    {
      title: 'Monochrome layering',
      caption: 'Асимметричные лацканы + мягкий пояс для идеальной посадки.',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Nordic light',
      caption: 'Светлые пуховики с объёмным воротом и тёплой подкладкой.',
      image: 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Evening stroll',
      caption: 'Драматичные тёмные оттенки и лаконичный силуэт без лишних деталей.',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    }
  ];

  perks = [
    { title: 'Персональный стилист', desc: 'Подбор образов по вашим параметрам и погоде.' },
    { title: 'Мгновенная доставка', desc: 'По Тбилиси за 2 часа, по миру — экспресс-доставка.' },
    { title: 'Сервис ухода', desc: 'Профессиональная чистка и восстановление тканей.' }
  ];

  editorials: EditorialStory[] = [
    {
      title: 'Как выбрать идеальный пуховик',
      summary: '5 вопросов, которые помогут найти свою модель: посадка, наполнители, температурный режим.',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      cta: 'Читать историю'
    },
    {
      title: 'Цвет сезона: графит',
      summary: 'Почему тёмно-серый стал новой классикой и как комбинировать его с базой.',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      cta: 'Открыть подборку'
    }
  ];

  communityGrid = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'
  ];

  constructor() {
    this.refreshItems();

    this.itemAddedSubscription = this.itemService.getItemAddedListener().subscribe(() => {
      this.refreshItems();
    });
  }

  refreshItems() {
    this.itemService.getItems().subscribe(
      val => this.items = val
    );
  }

  ngOnDestroy() {
    if (this.itemAddedSubscription) {
      this.itemAddedSubscription.unsubscribe();
    }
  }
}
