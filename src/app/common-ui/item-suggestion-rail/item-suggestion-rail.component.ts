import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {Item} from '../../data/interfaces/item.interface';
import {ItemCardComponent} from '../item-card/item-card.component';
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-item-suggestion-rail',
  standalone: true,
  imports: [CommonModule, ItemCardComponent, TranslateModule],
  templateUrl: './item-suggestion-rail.component.html',
  styleUrls: ['./item-suggestion-rail.component.scss']
})
export class ItemSuggestionRailComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() items: Item[] = [];
}
