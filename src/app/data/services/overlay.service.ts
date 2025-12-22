import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  isMenuOpen = signal(false);
  private document = inject(DOCUMENT);

  toggleMenu(): void {
    const newState = !this.isMenuOpen();
    this.isMenuOpen.set(newState);
    
    if (newState) {
      this.document.body.style.overflow = 'hidden';
      this.document.documentElement.style.overflow = 'hidden';
    } else {
      this.document.body.style.overflow = '';
      this.document.documentElement.style.overflow = '';
    }
  }
}
