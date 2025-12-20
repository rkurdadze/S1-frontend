import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }
}
