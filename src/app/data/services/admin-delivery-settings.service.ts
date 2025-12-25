import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {BASE_API_URL} from '../../app.config';
import {DeliveryServiceSetting} from '../interfaces/delivery.interface';
import {GoogleAuthService} from './google-auth.service';

@Injectable({providedIn: 'root'})
export class AdminDeliverySettingsService {
  private http = inject(HttpClient);
  private baseApiUrl = inject(BASE_API_URL);
  private auth = inject(GoogleAuthService);
  private baseUrl = `${this.baseApiUrl}admin/delivery/settings`;

  getSettings(): Observable<DeliveryServiceSetting[]> {
    return this.http
      .get<{ data: DeliveryServiceSetting[] }>(this.baseUrl, this.authHeaders())
      .pipe(map(res => res.data));
  }

  saveSettings(settings: DeliveryServiceSetting[]): Observable<DeliveryServiceSetting[]> {
    return this.http
      .put<{ data: DeliveryServiceSetting[] }>(this.baseUrl, { services: settings }, this.authHeaders())
      .pipe(map(res => res.data));
  }

  private authHeaders(): { headers: HttpHeaders } {
    const token = this.auth.token;
    if (!token) {
      return { headers: new HttpHeaders() };
    }
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }
}
