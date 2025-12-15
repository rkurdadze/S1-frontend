import {Component, inject, ViewChild} from '@angular/core';
import {EditModalComponent, EditModalField} from "../edit-modal/edit-modal.component";
import {ItemService} from "../../data/services/item.service";
import {Router} from "@angular/router";
import {Item} from "../../data/interfaces/item.interface";
import {AsyncPipe, NgIf} from "@angular/common";
import { GoogleAuthService } from '../../data/services/google-auth.service';
import {Observable} from "rxjs";
import {LoginButtonComponent} from "../login-button/login-button.component";
import {BASE_API_URL} from "../../app.config";
import {CartService} from "../../data/services/cart.service";
import {map} from "rxjs/operators";
import {RouterLink} from "@angular/router";
import {ToastService} from "../toast-container/toast.service";


declare var bootstrap: any;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    EditModalComponent,
    AsyncPipe,
    NgIf,
    LoginButtonComponent,
    RouterLink
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

  @ViewChild('editModalRef') editModalRef!: EditModalComponent;
  private itemService = inject(ItemService);
  private router = inject(Router);
  private toastService = inject(ToastService);


  constructor(private googleAuth: GoogleAuthService) {
    this.isLoggedIn$ = this.googleAuth.user$;

    // Подписываемся на изменения пользователя и обновляем `userIcon`
    this.isLoggedIn$.subscribe(user => {
      if (user && user.id) {
        this.userIcon = `${this.baseApiUrl}auth/${user.id}` || null;
        this.isAdmin = googleAuth.isAdmin;
      } else {
        this.userIcon = null;
      }
    });

  }

  modalTitle = 'ახალის დამატება';
  modalFields: EditModalField[] = [
    {
      name: 'name',
      label: 'დასახელება',
      type: 'text',
      required: true,
      placeholder: 'შეიყვანეთ დასახელება',
      maxLength: 200,
    },
    {
      name: 'description',
      label: 'აღწერილობა',
      type: 'text',
      placeholder: 'შეიყვანეთ აღწერილობა',
      maxLength: 1000,
    },
    {
      name: 'publish',
      label: 'გამოქვეყნება',
      type: 'checkbox',
    }
  ];
  modalData = {};


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


  toggleDropdown(event: Event) {
    event.stopPropagation();
    const dropdown = new bootstrap.Dropdown(event.target);
    dropdown.toggle();
  }


  addToFavorites(): void {
    const isMac = /Mac/i.test(navigator.userAgent);
    const shortcut = isMac ? '⌘ Cmd + D' : 'Ctrl + D';

    this.toastService.info(
        `Добавить страницу в избранное: нажмите ${shortcut}`,
        { autoClose: true, duration: 5000 }
    );
  }



}
