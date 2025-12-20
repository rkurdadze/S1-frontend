import { Component, inject, DestroyRef, HostListener } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OverlayService } from '../../data/services/overlay.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAIN_NAV_ITEMS } from '../navigation/main-nav-items';

type SupportedLanguage = 'ka' | 'en' | 'ru';

@Component({
  selector: 'app-overlay-menu',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, TranslateModule],
  templateUrl: './overlay-menu.component.html',
  styleUrls: ['./overlay-menu.component.scss']
})
export class OverlayMenuComponent {
  private overlayService = inject(OverlayService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  isMenuOpen = this.overlayService.isMenuOpen;
  languageDropdownOpen = false;

  languages: Array<{ code: SupportedLanguage; flag: string; label: string }> = [
    { code: 'ka', flag: '🇬🇪', label: 'ქართული' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' }
  ];
  currentLanguage: SupportedLanguage;
  private readonly storageKey = 'studio101_language';


  navItems = MAIN_NAV_ITEMS;

  constructor() {
    const initialLanguage = this.loadLanguage();
    this.translate.setDefaultLang('ka');
    this.translate.use(initialLanguage);
    this.currentLanguage = initialLanguage;

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLanguage = event.lang as SupportedLanguage;
      });
  }

  toggleMenu(): void {
    this.overlayService.toggleMenu();
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.languageDropdownOpen = !this.languageDropdownOpen;
  }

  onLanguageSelect(language: SupportedLanguage): void {
    this.setLanguage(language);
  }

  setLanguage(language: SupportedLanguage): void {
    if (language === this.currentLanguage) {
      this.languageDropdownOpen = false;
      return;
    }

    this.translate.use(language);
    this.persistLanguage(language);
    this.languageDropdownOpen = false;
  }

  get currentLanguageOption(): { code: SupportedLanguage; flag: string; label: string } {
    return this.languages.find(language => language.code === this.currentLanguage) ?? this.languages[0];
  }

  @HostListener('document:click')
  closeLanguageDropdown(): void {
    this.languageDropdownOpen = false;
  }

  private loadLanguage(): SupportedLanguage {
    try {
      const saved = localStorage.getItem(this.storageKey) as SupportedLanguage | null;
      if (saved && this.languages.some(({ code }) => code === saved)) {
        return saved;
      }
    } catch (error) {
      // ignore storage errors
    }

    return 'ka';
  }

  private persistLanguage(language: SupportedLanguage): void {
    try {
      localStorage.setItem(this.storageKey, language);
    } catch (error) {
      // ignore storage errors
    }
  }
}
