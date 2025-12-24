import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EventService {
    // Событие refreshItem
    private refreshItemSource = new Subject<{ id?: number, selectedColorHex?: string, dd1?: string }>();
    refresh$ = this.refreshItemSource.asObservable();

    // Методы для отправки событий
    emitRefreshItem(id?: number, selectedColorHex?: string, dd1?: string) {
        this.refreshItemSource.next({ id, selectedColorHex, dd1 });
    }



    // Новое событие anotherEvent
    private anotherEventSource = new Subject<string>();
    anotherEvent$ = this.anotherEventSource.asObservable();

    emitAnotherEvent(data: string) {
        this.anotherEventSource.next(data);
    }

    // Global admin data refresh
    private refreshAdminSource = new Subject<void>();
    refreshAdmin$ = this.refreshAdminSource.asObservable();

    emitRefreshAdmin() {
        this.refreshAdminSource.next();
    }
}
