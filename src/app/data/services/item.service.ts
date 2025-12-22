import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Item} from '../interfaces/item.interface';
import {Observable, Subject} from "rxjs";
import {Color} from "../interfaces/color.interface";
import {Photo} from "../interfaces/photo.interface";
import {BASE_API_URL} from "../../app.config";
import {GoogleAuthService} from "./google-auth.service";

@Injectable({
    providedIn: 'root'
})
export class ItemService {
    http = inject(HttpClient);
    baseApiUrl = inject(BASE_API_URL);
    auth = inject(GoogleAuthService);
    private itemAddedSubject = new Subject<void>(); // 🔹 Глобальный EventEmitter

    constructor() {
    }

    private authHeaders(extraHeaders: Record<string, string> = {}): { headers: HttpHeaders } {
        const token = this.auth.token;
        const headers: Record<string, string> = { ...extraHeaders };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return { headers: new HttpHeaders(headers) };
    }

    // Метод для подписки на события добавления элементов
    getItemAddedListener(): Observable<void> {
        return this.itemAddedSubject.asObservable();
    }

    // Метод для уведомления о добавлении элемента
    notifyItemAdded() {
        this.itemAddedSubject.next();
    }


    getItems() {
        return this.http.get<Item[]>(`${this.baseApiUrl}items`)
    }

    getItem(id: number): Observable<Item> {
        return this.http.get<Item>(`${this.baseApiUrl}items/${id}`);
    }

    addItem(item: Item): Observable<Item> {
        const itemToSubmit = {
            ...item,
            colors: JSON.stringify(item.colors) as unknown as Color[] // Приведение к Color[]
        };

        return this.http.post<Item>(`${this.baseApiUrl}items`, itemToSubmit, this.authHeaders());
    }


    addColors(colors: { name: string; item_id: number }[]): Observable<any> {
        const itemToSubmit = JSON.stringify(colors);
        return this.http.post<any>(`${this.baseApiUrl}colors`, itemToSubmit, this.authHeaders({'Content-Type': 'application/json'}));
    }

    editColor(color_id: number, color: { item_id: number; name: string }): Observable<any> {
        console.log('Сохраняем цвет:', color);
        const itemToSubmit = JSON.stringify(color);
        return this.http.put<any>(`${this.baseApiUrl}colors/${color_id}`, itemToSubmit, this.authHeaders({'Content-Type': 'application/json'}));
    }

    saveImages(photos: Photo[], itemId: number) {
        const itemsToSubmit = photos.map(photo => {
            // Если photo.image имеет вид "data:image/png;base64,..." или "image/png;base64,..."
            // - отрезаем всё до (и включая) 'base64,'.
            const base64Cleaned = photo.image?.replace(/^.*base64,/, '');

            return {
                ...photo,
                itemId: itemId,
                image: base64Cleaned
            };
        });

        return this.http.post<any>(
            `${this.baseApiUrl}photos`,
            JSON.stringify(itemsToSubmit),
            this.authHeaders({'Content-Type': 'application/json'})
        );
    }


    removeColor(color: { item_id: number; name: string }) { // Без []
        return this.http.delete<any>(`${this.baseApiUrl}colors`, {
            ...this.authHeaders({'Content-Type': 'application/json'}),
            body: color // Отправляем объект, а не массив
        });
    }


    save(item: Item) {
        return this.http.put<Item>(
            `${this.baseApiUrl}items/${item.id}`,
            JSON.stringify(item),
            this.authHeaders({'Content-Type': 'application/json'})
        );
    }

    delete(id: number) {
        return this.http.delete(`${this.baseApiUrl}items/${id}`, this.authHeaders({'Content-Type': 'application/json'}));
    }

}
