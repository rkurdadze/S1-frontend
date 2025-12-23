import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { BASE_API_URL } from '../../app.config';
import { GoogleAuthService } from './google-auth.service';
import {
  AdminCategory,
  AdminCollection,
  AdminDeliveryZone,
  AdminEditorial,
  AdminNewsItem,
  AdminNewsletterDraft,
  AdminNewsletterSegment,
  AdminNewsletterSend,
  AdminOrder,
  AdminPromotion,
  AdminUser
} from '../interfaces/admin/admin.interfaces';
import { Photo } from '../interfaces/photo.interface';

interface NewsletterSendPayload {
  subject: string;
  message: string;
  segmentIds: number[];
  test: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private http = inject(HttpClient);
  private baseApiUrl = inject(BASE_API_URL);
  private auth = inject(GoogleAuthService);

  private cache = new Map<string, Observable<any>>();

  private getCached<T>(key: string, request: Observable<T>, forceRefresh = false): Observable<T> {
    if (!this.cache.has(key) || forceRefresh) {
      this.cache.set(key, request.pipe(shareReplay(1)));
    }
    return this.cache.get(key)!;
  }

  private clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getCategories(forceRefresh = false): Observable<AdminCategory[]> {
    return this.getCached('categories', this.http.get<AdminCategory[]>(`${this.baseApiUrl}admin/categories`, this.authHeaders()), forceRefresh);
  }

  createCategory(payload: Omit<AdminCategory, 'id'>): Observable<AdminCategory> {
    this.clearCache('categories');
    return this.http.post<AdminCategory>(`${this.baseApiUrl}admin/categories`, payload, this.authHeaders());
  }

  updateCategory(category: AdminCategory): Observable<AdminCategory> {
    this.clearCache('categories');
    return this.http.put<AdminCategory>(`${this.baseApiUrl}admin/categories/${category.id}`, category, this.authHeaders());
  }

  deleteCategory(id: number): Observable<void> {
    this.clearCache('categories');
    return this.http.delete<void>(`${this.baseApiUrl}admin/categories/${id}`, this.authHeaders());
  }

  getNews(forceRefresh = false): Observable<AdminNewsItem[]> {
    return this.getCached('news', this.http.get<AdminNewsItem[]>(`${this.baseApiUrl}admin/news`, this.authHeaders()), forceRefresh);
  }

  createNews(payload: Omit<AdminNewsItem, 'id'>): Observable<AdminNewsItem> {
    this.clearCache('news');
    return this.http.post<AdminNewsItem>(`${this.baseApiUrl}admin/news`, payload, this.authHeaders());
  }

  updateNews(item: AdminNewsItem): Observable<AdminNewsItem> {
    this.clearCache('news');
    return this.http.put<AdminNewsItem>(`${this.baseApiUrl}admin/news/${item.id}`, item, this.authHeaders());
  }

  deleteNews(id: number): Observable<void> {
    this.clearCache('news');
    return this.http.delete<void>(`${this.baseApiUrl}admin/news/${id}`, this.authHeaders());
  }

  getCollections(forceRefresh = false): Observable<AdminCollection[]> {
    return this.getCached('collections', this.http.get<AdminCollection[]>(`${this.baseApiUrl}admin/collections`, this.authHeaders()), forceRefresh);
  }

  createCollection(payload: Omit<AdminCollection, 'id'>): Observable<AdminCollection> {
    this.clearCache('collections');
    return this.http.post<AdminCollection>(`${this.baseApiUrl}admin/collections`, payload, this.authHeaders());
  }

  updateCollection(collection: AdminCollection): Observable<AdminCollection> {
    this.clearCache('collections');
    return this.http.put<AdminCollection>(`${this.baseApiUrl}admin/collections/${collection.id}`, collection, this.authHeaders());
  }

  deleteCollection(id: number): Observable<void> {
    this.clearCache('collections');
    return this.http.delete<void>(`${this.baseApiUrl}admin/collections/${id}`, this.authHeaders());
  }

  getEditorials(forceRefresh = false): Observable<AdminEditorial[]> {
    return this.getCached('editorials', this.http.get<AdminEditorial[]>(`${this.baseApiUrl}admin/editorials`, this.authHeaders()), forceRefresh);
  }

  createEditorial(payload: Omit<AdminEditorial, 'id'>): Observable<AdminEditorial> {
    this.clearCache('editorials');
    return this.http.post<AdminEditorial>(`${this.baseApiUrl}admin/editorials`, payload, this.authHeaders());
  }

  updateEditorial(editorial: AdminEditorial): Observable<AdminEditorial> {
    this.clearCache('editorials');
    return this.http.put<AdminEditorial>(`${this.baseApiUrl}admin/editorials/${editorial.id}`, editorial, this.authHeaders());
  }

  deleteEditorial(id: number): Observable<void> {
    this.clearCache('editorials');
    return this.http.delete<void>(`${this.baseApiUrl}admin/editorials/${id}`, this.authHeaders());
  }

  getPromotions(forceRefresh = false): Observable<AdminPromotion[]> {
    return this.getCached('promotions', this.http.get<AdminPromotion[]>(`${this.baseApiUrl}admin/promotions`, this.authHeaders()), forceRefresh);
  }

  createPromotion(payload: Omit<AdminPromotion, 'id'>): Observable<AdminPromotion> {
    this.clearCache('promotions');
    return this.http.post<AdminPromotion>(`${this.baseApiUrl}admin/promotions`, payload, this.authHeaders());
  }

  updatePromotion(promotion: AdminPromotion): Observable<AdminPromotion> {
    this.clearCache('promotions');
    return this.http.put<AdminPromotion>(`${this.baseApiUrl}admin/promotions/${promotion.id}`, promotion, this.authHeaders());
  }

  deletePromotion(id: number): Observable<void> {
    this.clearCache('promotions');
    return this.http.delete<void>(`${this.baseApiUrl}admin/promotions/${id}`, this.authHeaders());
  }

  getUsers(forceRefresh = false): Observable<AdminUser[]> {
    return this.getCached('users', this.http.get<AdminUser[]>(`${this.baseApiUrl}admin/users`, this.authHeaders()), forceRefresh);
  }

  createUser(payload: Omit<AdminUser, 'id' | 'lastActive'>): Observable<AdminUser> {
    this.clearCache('users');
    return this.http.post<AdminUser>(`${this.baseApiUrl}admin/users`, payload, this.authHeaders());
  }

  updateUser(user: AdminUser): Observable<AdminUser> {
    this.clearCache('users');
    return this.http.put<AdminUser>(`${this.baseApiUrl}admin/users/${user.id}`, user, this.authHeaders());
  }

  deleteUser(id: number): Observable<void> {
    this.clearCache('users');
    return this.http.delete<void>(`${this.baseApiUrl}admin/users/${id}`, this.authHeaders());
  }

  getOrders(forceRefresh = false): Observable<AdminOrder[]> {
    return this.getCached('orders', this.http.get<AdminOrder[]>(`${this.baseApiUrl}admin/orders`, this.authHeaders()), forceRefresh);
  }

  updateOrder(order: AdminOrder): Observable<AdminOrder> {
    this.clearCache('orders');
    return this.http.put<AdminOrder>(`${this.baseApiUrl}admin/orders/${order.id}`, order, this.authHeaders());
  }

  deleteOrder(id: number): Observable<void> {
    this.clearCache('orders');
    return this.http.delete<void>(`${this.baseApiUrl}admin/orders/${id}`, this.authHeaders());
  }

  getDeliveryZones(forceRefresh = false): Observable<AdminDeliveryZone[]> {
    return this.getCached('delivery-zones', this.http.get<AdminDeliveryZone[]>(`${this.baseApiUrl}admin/delivery-zones`, this.authHeaders()), forceRefresh);
  }

  createDeliveryZone(payload: Omit<AdminDeliveryZone, 'id'>): Observable<AdminDeliveryZone> {
    this.clearCache('delivery-zones');
    return this.http.post<AdminDeliveryZone>(`${this.baseApiUrl}admin/delivery-zones`, payload, this.authHeaders());
  }

  updateDeliveryZone(zone: AdminDeliveryZone): Observable<AdminDeliveryZone> {
    this.clearCache('delivery-zones');
    return this.http.put<AdminDeliveryZone>(`${this.baseApiUrl}admin/delivery-zones/${zone.id}`, zone, this.authHeaders());
  }

  deleteDeliveryZone(id: number): Observable<void> {
    this.clearCache('delivery-zones');
    return this.http.delete<void>(`${this.baseApiUrl}admin/delivery-zones/${id}`, this.authHeaders());
  }

  getNewsletterDraft(): Observable<AdminNewsletterDraft> {
    return this.http.get<AdminNewsletterDraft>(`${this.baseApiUrl}admin/newsletter/draft`, this.authHeaders());
  }

  updateNewsletterDraft(draft: AdminNewsletterDraft): Observable<AdminNewsletterDraft> {
    return this.http.put<AdminNewsletterDraft>(`${this.baseApiUrl}admin/newsletter/draft`, draft, this.authHeaders());
  }

  getNewsletterSegments(forceRefresh = false): Observable<AdminNewsletterSegment[]> {
    return this.getCached('newsletter-segments', this.http.get<AdminNewsletterSegment[]>(`${this.baseApiUrl}admin/newsletter/segments`, this.authHeaders()), forceRefresh);
  }

  createNewsletterSegment(payload: Omit<AdminNewsletterSegment, 'id'>): Observable<AdminNewsletterSegment> {
    this.clearCache('newsletter-segments');
    return this.http.post<AdminNewsletterSegment>(`${this.baseApiUrl}admin/newsletter/segments`, payload, this.authHeaders());
  }

  deleteNewsletterSegment(id: number): Observable<void> {
    this.clearCache('newsletter-segments');
    return this.http.delete<void>(`${this.baseApiUrl}admin/newsletter/segments/${id}`, this.authHeaders());
  }

  sendNewsletter(payload: NewsletterSendPayload): Observable<AdminNewsletterSend> {
    return this.http.post<AdminNewsletterSend>(`${this.baseApiUrl}admin/newsletter/send`, payload, this.authHeaders());
  }

  getTags(forceRefresh = false): Observable<string[]> {
    return this.getCached('tags', this.http.get<string[]>(`${this.baseApiUrl}admin/tags`, this.authHeaders()), forceRefresh);
  }

  createTag(tag: string): Observable<void> {
    this.clearCache('tags');
    return this.http.post<void>(`${this.baseApiUrl}admin/tags`, { tag }, this.authHeaders());
  }

  deleteTag(tag: string): Observable<void> {
    this.clearCache('tags');
    return this.http.delete<void>(`${this.baseApiUrl}admin/tags/${encodeURIComponent(tag)}`, this.authHeaders());
  }

  getItemTags(itemId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseApiUrl}admin/items/${itemId}/tags`, this.authHeaders());
  }

  updateItemTags(itemId: number, tags: string[]): Observable<string[]> {
    return this.http.put<string[]>(`${this.baseApiUrl}admin/items/${itemId}/tags`, tags, this.authHeaders());
  }

  getItemColorPhotos(itemId: number, colorId: number): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.baseApiUrl}items/${itemId}/colors/${colorId}/photos`, this.authHeaders());
  }

  deletePhoto(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}photos/${photoId}`, this.authHeaders());
  }

  private authHeaders(): { headers: HttpHeaders } {
    const token = this.auth.token;
    if (!token) {
      return { headers: new HttpHeaders() };
    }
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }
}
