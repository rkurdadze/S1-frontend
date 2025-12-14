import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {
    private isLoading = new BehaviorSubject<boolean>(false);
    isLoading$ = this.isLoading.asObservable();

    show() {
        this.isLoading.next(true);
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.isLoading.next(false);
        document.body.style.overflow = '';
    }
}