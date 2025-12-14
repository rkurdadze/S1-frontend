import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BASE_API_URL} from '../../app.config';
import {Observable} from 'rxjs';
import {ShareRequest, ShareResponse} from '../interfaces/share.interface';

@Injectable({
    providedIn: 'root'
})
export class ShareService {
    private http = inject(HttpClient);
    private baseApiUrl = inject(BASE_API_URL);

    createItemShare(itemId: number, payload: ShareRequest): Observable<ShareResponse> {
        const requestBody: ShareRequest = {
            ...payload,
            itemId,
        };

        return this.http.post<ShareResponse>(`${this.baseApiUrl}share/item/${itemId}`, requestBody);
    }
}
