import { Component, EventEmitter, Input, Output } from '@angular/core';
import {NgFor, NgIf} from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PROFILE_MENU_ICON_PATHS, ProfileMenuItem } from './profile-menu.types';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
    imports: [NgFor, RouterLink, TranslateModule, NgIf],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss'
})
export class ProfileMenuComponent {
  @Input() items: ProfileMenuItem[] = [];
  @Input() isLoggedIn = false;
  @Input() isAdmin = false;

  @Output() selectItem = new EventEmitter<ProfileMenuItem>();

  readonly icons = PROFILE_MENU_ICON_PATHS;

  get visibleItems(): ProfileMenuItem[] {
    return this.items.filter(item => {
      if (item.adminOnly && !this.isAdmin) {
        return false;
      }

      if (item.requiresAuth && !this.isLoggedIn) {
        return false;
      }

      if (item.guestOnly && this.isLoggedIn) {
        return false;
      }

      return true;
    });
  }

  onItemSelect(item: ProfileMenuItem): void {
    this.selectItem.emit(item);
  }

  trackByLabel(_: number, item: ProfileMenuItem): string {
    return item.labelKey;
  }
}
