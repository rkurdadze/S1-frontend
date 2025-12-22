import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import {BASE_API_URL} from "../../app.config";

@Injectable({
    providedIn: 'root'
})
export class GoogleAuthService {
    baseApiUrl = inject(BASE_API_URL);
    private clientId = '345127395384-dm21c5p0c17esmnmh94588vo4opbd6nj.apps.googleusercontent.com';
    private userSubject = new BehaviorSubject<any>(null);

    constructor(private http: HttpClient) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            this.userSubject.next(user);
        }
    }

    get user$(): Observable<any> {
        return this.userSubject.asObservable();
    }

    get currentUser(): any {
        return this.userSubject.getValue();
    }

    get isAdmin(): boolean {
        const user = this.userSubject.getValue();
        return user?.user?.role?.name === 'Administrator';
    }

    get isManager(): boolean {
        const user = this.userSubject.getValue();
        return user?.user?.role?.name === 'Manager';
    }

    get isAdminOrManager(): boolean {
        return this.isAdmin || this.isManager;
    }

    get token(): string | null {
        const currentUser = this.currentUser;
        const tokenFromCurrent = this.extractToken(currentUser);
        if (tokenFromCurrent) {
            return tokenFromCurrent;
        }
        if (typeof localStorage === 'undefined') {
            return null;
        }
        const stored = localStorage.getItem('user');
        if (!stored) {
            return null;
        }
        try {
            const parsed = JSON.parse(stored);
            return this.extractToken(parsed);
        } catch {
            return null;
        }
    }

    private extractToken(source: unknown): string | null {
        if (!source || typeof source !== 'object') {
            if (typeof source === 'string') {
                return source;
            }
            return null;
        }
        const candidate = source as Record<string, any>;
        const nestedUser = candidate['user'] as Record<string, any> | undefined;
        return (
            candidate['token'] ||
            candidate['accessToken'] ||
            candidate['access_token'] ||
            candidate['jwt'] ||
            candidate['jwtToken'] ||
            candidate['authToken'] ||
            candidate['data']?.['token'] ||
            nestedUser?.['token'] ||
            nestedUser?.['accessToken'] ||
            nestedUser?.['access_token'] ||
            nestedUser?.['jwt'] ||
            nestedUser?.['jwtToken'] ||
            nestedUser?.['authToken'] ||
            nestedUser?.['data']?.['token'] ||
            null
        );
    }

    loadGoogleAuth(): Promise<void> {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    }

    initGoogleLogin(callback: (response: any) => void): void {
        (window as any).google.accounts.id.initialize({
            client_id: this.clientId,
            callback: callback,
        });
    }

    renderGoogleButton(elementId: string): void {
        (window as any).google.accounts.id.renderButton(
            document.getElementById(elementId),
            { theme: 'outline', size: 'large' }
        );
    }

    signInWithGoogle(token: string): void {
        console.log("[GoogleAuthService] Отправка токена на сервер для входа...");

        this.http.post(`${this.baseApiUrl}auth/google`, { token }).subscribe({
            next: (res: any) => {
                console.log("[GoogleAuthService] Вход выполнен успешно:", res); // Проверяем содержимое ответа
                if (!res.picture) {
                    console.warn("[GoogleAuthService] Поле picture отсутствует в ответе!");
                }
                localStorage.setItem('user', JSON.stringify(res));
                this.userSubject.next(res);
            },
            error: (err) => console.error("[GoogleAuthService] Ошибка входа", err),
        });
    }



    logout(): void {
        localStorage.removeItem('user');
        this.userSubject.next(null);
    }

}
