import {Component, AfterViewInit, inject} from '@angular/core';
import { GoogleAuthService } from '../../data/services/google-auth.service';
import { Observable } from 'rxjs';
import { AsyncPipe, NgIf } from "@angular/common";
import { ActivatedRoute, Router } from '@angular/router';
import {TranslateModule, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    AsyncPipe,
    NgIf,
    TranslateModule
  ],
  standalone: true
})
export class LoginComponent implements AfterViewInit {
  isLoggedIn$: Observable<any>;
  private returnUrl: string | null = null;

  constructor(
      private googleAuth: GoogleAuthService,
      private route: ActivatedRoute,
      private router: Router
  ) {
    this.isLoggedIn$ = this.googleAuth.user$;
  }

  ngAfterViewInit(): void {
    // Получаем returnUrl из query параметров
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.googleAuth.loadGoogleAuth().then(() => {
      this.googleAuth.initGoogleLogin(this.handleCredentialResponse.bind(this));
      this.googleAuth.renderGoogleButton('google-signin-button');
    });
  }

  handleCredentialResponse(response: any): void {
    const token = response.credential;

    // Вход через Google
    this.googleAuth.signInWithGoogle(token);

    // Перенаправляем на returnUrl после входа
    this.isLoggedIn$.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this.router.navigateByUrl(this.returnUrl!);
      }
    });
  }

  logout(): void {
    this.googleAuth.logout();

    // Полностью удаляем старый элемент и создаём заново
    const buttonContainer = document.getElementById('google-signin-button');
    if (buttonContainer) {
      buttonContainer.innerHTML = ''; // Очищаем контейнер
    }

    setTimeout(() => {
      this.googleAuth.renderGoogleButton('google-signin-button');
    }, 500);
  }
}
