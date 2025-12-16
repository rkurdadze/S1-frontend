import { Component, DestroyRef, ViewChild, inject, NgZone } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from "@angular/router";
import { AsyncPipe, NgFor, NgIf } from "@angular/common";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { EditModalComponent, EditModalField } from "../edit-modal/edit-modal.component";
import { ItemService } from "../../data/services/item.service";
import { Item } from "../../data/interfaces/item.interface";
import { GoogleAuthService } from '../../data/services/google-auth.service';
import { LoginButtonComponent } from "../login-button/login-button.component";
import { BASE_API_URL } from "../../app.config";
import { CartService } from "../../data/services/cart.service";
import { ToastService } from "../toast-container/toast.service";


declare var bootstrap: any;

type SupportedLanguage = 'ka' | 'en' | 'ru';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    EditModalComponent,
    AsyncPipe,
    NgFor,
    NgIf,
    LoginButtonComponent,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  isLoggedIn$: Observable<any>;
  private cartService = inject(CartService);
  cartCount$ = this.cartService.items$.pipe(map(items => items.reduce((total, item) => total + item.quantity, 0)));
  baseApiUrl = inject(BASE_API_URL);
  userIcon: string | null = null;
  isAdmin: boolean = false;
  isMenuOpen = false;
  private readonly storageKey = 'studio101_language';
  languages: Array<{ code: SupportedLanguage; flag: string; label: string }> = [
    { code: 'ka', flag: '🇬🇪', label: 'ქართული' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' }
  ];
  currentLanguage: SupportedLanguage;

  @ViewChild('editModalRef') editModalRef!: EditModalComponent;
  private itemService = inject(ItemService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);


  constructor(private googleAuth: GoogleAuthService) {
    this.translate.addLangs(this.languages.map(({ code }) => code));
    const initialLanguage = this.loadLanguage();
    this.translate.setDefaultLang('ka');
    this.translate.use(initialLanguage);
    this.currentLanguage = initialLanguage;
    this.isLoggedIn$ = this.googleAuth.user$;

    // Подписываемся на изменения пользователя и обновляем `userIcon`
    this.isLoggedIn$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user && user.id) {
          this.userIcon = `${this.baseApiUrl}auth/${user.id}` || null;
          this.isAdmin = googleAuth.isAdmin;
        } else {
          this.userIcon = null;
        }
      });

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLanguage = event.lang as SupportedLanguage;
        this.updateModalContent();
      });

    this.updateModalContent();

  }

  modalTitle = '';
  modalFields: EditModalField[] = [];
  modalData = {};


  setLanguage(language: SupportedLanguage): void {
    if (language === this.currentLanguage) {
      return;
    }

    this.translate.use(language);
    this.persistLanguage(language);
  }

  private updateModalContent(): void {
    this.modalTitle = this.translate.instant('modal.title');
    this.modalFields = [
      {
        name: 'name',
        label: this.translate.instant('modal.name.label'),
        type: 'text',
        required: true,
        placeholder: this.translate.instant('modal.name.placeholder'),
        maxLength: 200,
      },
      {
        name: 'description',
        label: this.translate.instant('modal.description.label'),
        type: 'text',
        placeholder: this.translate.instant('modal.description.placeholder'),
        maxLength: 1000,
      },
      {
        name: 'publish',
        label: this.translate.instant('modal.publish.label'),
        type: 'checkbox',
      }
    ];
  }


  openModal(): void {
    this.editModalRef.openModal();
  }

  onModalResult(editedData: any): void {
    this.itemService.addItem(editedData).subscribe({
      next: (response: Item) => {
        this.router.navigate(['/item', response.id]); // Navigate to item-page with item ID
      },
      error: (error: any) => {

      }
    })
  }


  logout(): void {
    this.googleAuth.logout();
  }


  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    const dropdown = new bootstrap.Dropdown(event.target);
    dropdown.toggle();
  }


  addToFavorites(): void {
    const isMac = /Mac/i.test(navigator.userAgent);
    const shortcut = isMac ? '⌘ Cmd + D' : 'Ctrl + D';

    const message = this.translate.instant('toast.favorites', { shortcut });

    this.toastService.info(
      message,
      { autoClose: true, duration: 5000 }
    );
  }


  onNavClick(event: MouseEvent, targetId: string): void {
    event.preventDefault();

    const wasOpen = this.isMenuOpen;
    this.isMenuOpen = false;

    const runScroll = () => this.scrollToAnchor(targetId);

    // если мы уже на главной — просто скроллим
    if (this.router.url.startsWith('/#') || this.router.url === '/' || this.router.url.includes('#')) {
      if (wasOpen) {
        requestAnimationFrame(runScroll);
      } else {
        runScroll();
      }
      return;
    }

    // если мы НЕ на странице с якорями — сначала переходим, потом скроллим
    this.router.navigate(['/'], { fragment: targetId }).then(() => {
      this.zone.onStable
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          // Angular полностью стабилизировался — DOM гарантированно готов
          this.scrollToAnchor(targetId);
        });
    });
  }

  private scrollToAnchor(targetId: string): void {
    const target = document.getElementById(targetId);
    if (!target) return;

    history.pushState(null, '', `#${targetId}`);

    const targetTop = target.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: targetTop - 10,
      behavior: 'smooth'
    });
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
