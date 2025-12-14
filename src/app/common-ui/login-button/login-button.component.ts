import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-button',
  standalone: true,
  templateUrl: './login-button.component.html',
  styleUrl: './login-button.component.scss',
})
export class LoginButtonComponent {
  constructor(private router: Router) {}

  navigateToLogin(): void {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }
}
