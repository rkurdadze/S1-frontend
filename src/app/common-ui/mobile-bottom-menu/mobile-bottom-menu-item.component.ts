import { Component, EventEmitter, Input, Output } from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PROFILE_MENU_ICON_PATHS, ProfileMenuIcon } from '../profile-menu/profile-menu.types';

@Component({
  selector: 'app-mobile-bottom-menu-item',
  standalone: true,
    imports: [NgIf, RouterLink, TranslateModule, NgForOf],
  templateUrl: './mobile-bottom-menu-item.component.html',
  styleUrl: './mobile-bottom-menu-item.component.scss'
})
export class MobileBottomMenuItemComponent {
  @Input() labelKey!: string;
  @Input() icon!: ProfileMenuIcon;
  @Input() routerLink?: string | any[];
  @Input() active = false;
  @Input() badge?: number | null;

  @Output() itemClick = new EventEmitter<void>();

  readonly icons = PROFILE_MENU_ICON_PATHS;

  onClick(): void {
    this.itemClick.emit();
  }
}
