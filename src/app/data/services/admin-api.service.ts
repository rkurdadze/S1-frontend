import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getCategories(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(`${this.baseApiUrl}admin/categories`, this.authHeaders());
  }

  createCategory(payload: Omit<AdminCategory, 'id'>): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(`${this.baseApiUrl}admin/categories`, payload, this.authHeaders());
  }

  updateCategory(category: AdminCategory): Observable<AdminCategory> {
    return this.http.put<AdminCategory>(`${this.baseApiUrl}admin/categories/${category.id}`, category, this.authHeaders());
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/categories/${id}`, this.authHeaders());
  }

  getNews(): Observable<AdminNewsItem[]> {
    return this.http.get<AdminNewsItem[]>(`${this.baseApiUrl}admin/news`, this.authHeaders());
  }

  createNews(payload: Omit<AdminNewsItem, 'id'>): Observable<AdminNewsItem> {
    return this.http.post<AdminNewsItem>(`${this.baseApiUrl}admin/news`, payload, this.authHeaders());
  }

  updateNews(item: AdminNewsItem): Observable<AdminNewsItem> {
    return this.http.put<AdminNewsItem>(`${this.baseApiUrl}admin/news/${item.id}`, item, this.authHeaders());
  }

  deleteNews(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/news/${id}`, this.authHeaders());
  }

  getCollections(): Observable<AdminCollection[]> {
    return this.http.get<AdminCollection[]>(`${this.baseApiUrl}admin/collections`, this.authHeaders());
  }

  createCollection(payload: Omit<AdminCollection, 'id'>): Observable<AdminCollection> {
    return this.http.post<AdminCollection>(`${this.baseApiUrl}admin/collections`, payload, this.authHeaders());
  }

  updateCollection(collection: AdminCollection): Observable<AdminCollection> {
    return this.http.put<AdminCollection>(`${this.baseApiUrl}admin/collections/${collection.id}`, collection, this.authHeaders());
  }

  deleteCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/collections/${id}`, this.authHeaders());
  }

  getEditorials(): Observable<AdminEditorial[]> {
    return this.http.get<AdminEditorial[]>(`${this.baseApiUrl}admin/editorials`, this.authHeaders());
  }

  createEditorial(payload: Omit<AdminEditorial, 'id'>): Observable<AdminEditorial> {
    return this.http.post<AdminEditorial>(`${this.baseApiUrl}admin/editorials`, payload, this.authHeaders());
  }

  updateEditorial(editorial: AdminEditorial): Observable<AdminEditorial> {
    return this.http.put<AdminEditorial>(`${this.baseApiUrl}admin/editorials/${editorial.id}`, editorial, this.authHeaders());
  }

  deleteEditorial(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/editorials/${id}`, this.authHeaders());
  }

  getPromotions(): Observable<AdminPromotion[]> {
    return this.http.get<AdminPromotion[]>(`${this.baseApiUrl}admin/promotions`, this.authHeaders());
  }

  createPromotion(payload: Omit<AdminPromotion, 'id'>): Observable<AdminPromotion> {
    return this.http.post<AdminPromotion>(`${this.baseApiUrl}admin/promotions`, payload, this.authHeaders());
  }

  updatePromotion(promotion: AdminPromotion): Observable<AdminPromotion> {
    return this.http.put<AdminPromotion>(`${this.baseApiUrl}admin/promotions/${promotion.id}`, promotion, this.authHeaders());
  }

  deletePromotion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/promotions/${id}`, this.authHeaders());
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseApiUrl}admin/users`, this.authHeaders());
  }

  createUser(payload: Omit<AdminUser, 'id' | 'lastActive'>): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseApiUrl}admin/users`, payload, this.authHeaders());
  }

  updateUser(user: AdminUser): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseApiUrl}admin/users/${user.id}`, user, this.authHeaders());
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/users/${id}`, this.authHeaders());
  }

  getOrders(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>(`${this.baseApiUrl}admin/orders`, this.authHeaders());
  }

  updateOrder(order: AdminOrder): Observable<AdminOrder> {
    return this.http.put<AdminOrder>(`${this.baseApiUrl}admin/orders/${order.id}`, order, this.authHeaders());
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/orders/${id}`, this.authHeaders());
  }

  getDeliveryZones(): Observable<AdminDeliveryZone[]> {
    return this.http.get<AdminDeliveryZone[]>(`${this.baseApiUrl}admin/delivery-zones`, this.authHeaders());
  }

  createDeliveryZone(payload: Omit<AdminDeliveryZone, 'id'>): Observable<AdminDeliveryZone> {
    return this.http.post<AdminDeliveryZone>(`${this.baseApiUrl}admin/delivery-zones`, payload, this.authHeaders());
  }

  updateDeliveryZone(zone: AdminDeliveryZone): Observable<AdminDeliveryZone> {
    return this.http.put<AdminDeliveryZone>(`${this.baseApiUrl}admin/delivery-zones/${zone.id}`, zone, this.authHeaders());
  }

  deleteDeliveryZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/delivery-zones/${id}`, this.authHeaders());
  }

  getNewsletterDraft(): Observable<AdminNewsletterDraft> {
    return this.http.get<AdminNewsletterDraft>(`${this.baseApiUrl}admin/newsletter/draft`, this.authHeaders());
  }

  updateNewsletterDraft(draft: AdminNewsletterDraft): Observable<AdminNewsletterDraft> {
    return this.http.put<AdminNewsletterDraft>(`${this.baseApiUrl}admin/newsletter/draft`, draft, this.authHeaders());
  }

  getNewsletterSegments(): Observable<AdminNewsletterSegment[]> {
    return this.http.get<AdminNewsletterSegment[]>(`${this.baseApiUrl}admin/newsletter/segments`, this.authHeaders());
  }

  createNewsletterSegment(payload: Omit<AdminNewsletterSegment, 'id'>): Observable<AdminNewsletterSegment> {
    return this.http.post<AdminNewsletterSegment>(`${this.baseApiUrl}admin/newsletter/segments`, payload, this.authHeaders());
  }

  deleteNewsletterSegment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseApiUrl}admin/newsletter/segments/${id}`, this.authHeaders());
  }

  sendNewsletter(payload: NewsletterSendPayload): Observable<AdminNewsletterSend> {
    return this.http.post<AdminNewsletterSend>(`${this.baseApiUrl}admin/newsletter/send`, payload, this.authHeaders());
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseApiUrl}admin/tags`, this.authHeaders());
  }

  createTag(tag: string): Observable<void> {
    return this.http.post<void>(`${this.baseApiUrl}admin/tags`, { tag }, this.authHeaders());
  }

  deleteTag(tag: string): Observable<void> {
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
