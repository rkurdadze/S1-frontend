import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from "../header/header.component";
import {TranslateModule} from "@ngx-translate/core";
import { MobileBottomMenuComponent } from "../mobile-bottom-menu/mobile-bottom-menu.component";

@Component({
  selector: 'app-layout',
  standalone: true,
    imports: [
        RouterOutlet,
        HeaderComponent,
        TranslateModule,
        MobileBottomMenuComponent
    ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  currentYear = new Date().getFullYear();
}
