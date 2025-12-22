import { Component, inject, OnInit } from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {HeaderComponent} from "../header/header.component";
import {TranslateModule} from "@ngx-translate/core";
import { MobileBottomMenuComponent } from "../mobile-bottom-menu/mobile-bottom-menu.component";
import {NgIf} from "@angular/common";
import {filter} from "rxjs/operators";

@Component({
  selector: 'app-layout',
  standalone: true,
    imports: [
        RouterOutlet,
        HeaderComponent,
        TranslateModule,
        MobileBottomMenuComponent,
        NgIf
    ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  currentYear = new Date().getFullYear();
  isAdminPage = false;
  openFooterSections: { [key: string]: boolean } = {};

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkAdminPage();
    });
    
    // Initial check
    this.checkAdminPage();
  }

  private checkAdminPage() {
    this.isAdminPage = this.router.url.includes('/admin');
  }

  toggleFooterSection(section: string) {
    this.openFooterSections[section] = !this.openFooterSections[section];
  }
}
