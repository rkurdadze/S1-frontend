import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileMenuService {
  private readonly addItemRequestSource = new Subject<void>();

  readonly addItemRequested$ = this.addItemRequestSource.asObservable();

  requestAddItem(): void {
    this.addItemRequestSource.next();
  }
}
