import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {TranslateModule} from "@ngx-translate/core";

@Component({
    selector: 'app-login-button',
    standalone: true,
    templateUrl: './login-button.component.html',
    styleUrl: './login-button.component.scss',
    imports: [
        TranslateModule
    ]
})
export class LoginButtonComponent {
  constructor(private router: Router) {}

  navigateToLogin(): void {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }
}
