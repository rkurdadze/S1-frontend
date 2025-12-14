import {inject, Injectable} from '@angular/core';
import {BASE_API_URL} from "../../app.config";
import {Item} from "../interfaces/item.interface";
import {HttpClient} from "@angular/common/http";
import {Inventories} from "../interfaces/inventories.interface";
import {Observable} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private http = inject(HttpClient);
    baseApiUrl =  inject(BASE_API_URL);

    constructor() { }

    getInventoryForItem(item: Item ){
        return this.http.get<Inventories>(`${this.baseApiUrl}inventory/item/${item.id}`);
    }

    getInventoryForColorName(item: Item, colorName: string): Observable<Inventories[]> {
        const encodedColorName = encodeURIComponent(colorName); // ✅ Кодируем colorName
        return this.http.get<Inventories[]>(`${this.baseApiUrl}inventory/item/color_name/${item.id}/${encodedColorName}`);
    }

    save(editedData: any) {
        return this.http.post<any>(
            `${this.baseApiUrl}inventory`,
            JSON.stringify(editedData),
            { headers: { 'Content-Type': 'application/json' } }
        );
    }

    update(editedData: { id: any; stockCount: any }) {
        return this.http.put(
            `${this.baseApiUrl}inventory`,
            JSON.stringify(editedData),
            { headers: { 'Content-Type': 'application/json' } }
        );
    }

    delete(inventory_id: number) {
        return this.http.delete(
            `${this.baseApiUrl}inventory/${inventory_id}`,
            { headers: { 'Content-Type': 'application/json' } }
        );
    }
}