import { Component } from '@angular/core';
import { LoaderService } from '../../data/services/loader.service';
import {AsyncPipe, NgIf} from "@angular/common";
import {Observable} from "rxjs";

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading-overlay" *ngIf="isLoading$ | async">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading...</div>
    </div>
  `,
  imports: [
    AsyncPipe,
    NgIf
  ],
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  isLoading$: Observable<boolean>;

  constructor(private loaderService: LoaderService) {
    this.isLoading$ = this.loaderService.isLoading$; // ✅ Proper initialization
  }
}