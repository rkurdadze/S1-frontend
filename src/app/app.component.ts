import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LoaderService} from "./data/services/loader.service";
import {ToastContainerComponent} from "./common-ui/toast-container/toast-container.component";
import { OverlayMenuComponent } from './common-ui/overlay-menu/overlay-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html', // Указываем путь к HTML-файлу
  styleUrls: ['./app.component.scss'],
    imports: [
        RouterOutlet,
        ToastContainerComponent,
        OverlayMenuComponent
    ],
  // Указываем путь к стилям
})
export class AppComponent {
}
