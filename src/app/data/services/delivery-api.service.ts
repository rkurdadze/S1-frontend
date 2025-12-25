import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, throwError, timer} from 'rxjs';
import {catchError, map, retryWhen, shareReplay, switchMap} from 'rxjs/operators';
import {BASE_API_URL} from '../../app.config';
import {
  Address,
  AddressType,
  City,
  CreateOrderDto,
  DeliveryOrder,
  PudoCity,
  PudoPoint,
  Region
} from '../interfaces/delivery.interface';
import {ToastService} from '../../common-ui/toast-container/toast.service';

@Injectable({providedIn: 'root'})
export class DeliveryApiService {
  private http = inject(HttpClient);
  private baseApiUrl = inject(BASE_API_URL);
  private toast = inject(ToastService);
  private baseUrl = `${this.baseApiUrl}delivery`;

  private regions$?: Observable<Region[]>;
  private cities$?: Observable<City[]>;
  private pudoCities$?: Observable<PudoCity[]>;
  private citiesByRegion = new Map<number, Observable<City[]>>();
  private pudosByCity = new Map<number, Observable<PudoPoint[]>>();

  getRegions(): Observable<Region[]> {
    if (!this.regions$) {
      this.regions$ = this.http
        .get<{ data: Region[] }>(`${this.baseUrl}/regions`)
        .pipe(this.handleRateLimit(), map(res => res.data), shareReplay(1));
    }
    return this.regions$;
  }

  getCities(): Observable<City[]> {
    if (!this.cities$) {
      this.cities$ = this.http
        .get<{ data: City[] }>(`${this.baseUrl}/cities`)
        .pipe(this.handleRateLimit(), map(res => res.data), shareReplay(1));
    }
    return this.cities$;
  }

  getCitiesByRegion(regionId: number): Observable<City[]> {
    if (!this.citiesByRegion.has(regionId)) {
      const request$ = this.http
        .get<{ data: City[] }>(`${this.baseUrl}/region/${regionId}/cities`)
        .pipe(this.handleRateLimit(), map(res => res.data), shareReplay(1));
      this.citiesByRegion.set(regionId, request$);
    }
    return this.citiesByRegion.get(regionId)!;
  }

  getPudoCities(): Observable<PudoCity[]> {
    if (!this.pudoCities$) {
      this.pudoCities$ = this.http
        .get<{ data: PudoCity[] }>(`${this.baseUrl}/pudo/cities`)
        .pipe(this.handleRateLimit(), map(res => res.data), shareReplay(1));
    }
    return this.pudoCities$;
  }

  getPudosByCity(cityId: number): Observable<PudoPoint[]> {
    if (!this.pudosByCity.has(cityId)) {
      const request$ = this.http
        .get<{ data: PudoPoint[] }>(`${this.baseUrl}/city/${cityId}/pudos`)
        .pipe(this.handleRateLimit(), map(res => res.data), shareReplay(1));
      this.pudosByCity.set(cityId, request$);
    }
    return this.pudosByCity.get(cityId)!;
  }

  listAddresses(type?: AddressType): Observable<Address[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http
      .get<{ data: Address[] }>(`${this.baseUrl}/addresses`, { params })
      .pipe(this.handleRateLimit(), map(res => res.data));
  }

  createAddress(body: { address: string; type: AddressType; city_id: number }): Observable<Address> {
    return this.http
      .post<{ address: Address; message: string }>(`${this.baseUrl}/addresses`, body)
      .pipe(this.handleRateLimit(), map(res => res.address));
  }

  getAddress(id: number): Observable<Address> {
    return this.http
      .get<{ data: Address }>(`${this.baseUrl}/addresses/${id}`)
      .pipe(this.handleRateLimit(), map(res => res.data));
  }

  updateAddress(id: number, dto: Partial<Address> & { address?: string; type?: AddressType; city_id?: number }): Observable<Address> {
    return this.http
      .put<{ data: Address }>(`${this.baseUrl}/addresses/${id}`, dto)
      .pipe(this.handleRateLimit(), map(res => res.data));
  }

  deleteAddress(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/addresses/${id}`)
      .pipe(this.handleRateLimit());
  }

  listOrders(): Observable<DeliveryOrder[]> {
    return this.http
      .get<{ data: DeliveryOrder[] }>(`${this.baseUrl}/orders`)
      .pipe(this.handleRateLimit(), map(res => res.data));
  }

  getOrder(id: number | string): Observable<DeliveryOrder> {
    return this.http
      .get<{ data: DeliveryOrder }>(`${this.baseUrl}/orders/${id}`)
      .pipe(this.handleRateLimit(), map(res => res.data));
  }

  createOrder(order: CreateOrderDto): Observable<DeliveryOrder> {
    return this.http
      .post<{ success: boolean; order: DeliveryOrder; message?: string }>(`${this.baseUrl}/orders`, order)
      .pipe(this.handleRateLimit(), map(res => res.order));
  }

  updateOrder(id: number, order: Partial<CreateOrderDto>): Observable<DeliveryOrder> {
    return this.http
      .put<{ data: DeliveryOrder }>(`${this.baseUrl}/orders/${id}`, order)
      .pipe(this.handleRateLimit(), map(res => res.data));
  }

  deleteOrder(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/orders/${id}`)
      .pipe(this.handleRateLimit());
  }

  private handleRateLimit<T>() {
    return (source: Observable<T>) =>
      source.pipe(
        retryWhen(errors =>
          errors.pipe(
            switchMap((error: HttpErrorResponse, index) => {
              if (error.status === 429) {
                const retryInMs = 1000 + index * 500;
                this.toast.info(`Достигнут лимит запросов. Повтор через ${retryInMs / 1000} сек.`);
                return timer(retryInMs);
              }
              return throwError(() => error);
            })
          )
        ),
        catchError(err => {
          return throwError(() => err);
        })
      );
  }
}
