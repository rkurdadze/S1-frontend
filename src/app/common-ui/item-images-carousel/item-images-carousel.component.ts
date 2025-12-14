import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {EventService} from "../../data/services/event.service";
import {HttpClient} from "@angular/common/http";
import {BASE_API_URL} from "../../app.config";

@Component({
    selector: 'app-item-images-carousel',
    standalone: true,
    imports: [
        NgForOf,
        NgIf
    ],
    templateUrl: './item-images-carousel.component.html',
    styleUrl: './item-images-carousel.component.scss'
})
export class ItemImagesCarouselComponent {
    @Input() images: { id: string, url: string }[] = [];
    @Input() isAdmin: boolean = false;
    @Output() imageSelected = new EventEmitter<{ id: string, url: string }>();

    selectedImage: { id: string, url: string } | null = null;
    baseApiUrl = inject(BASE_API_URL);



    constructor(
        private eventService: EventService,
        private http: HttpClient,
    ) {
    }


    selectImage(image: { id: string, url: string }) {
        this.imageSelected.emit(image);
    }

    deleteImage(imageId: string, event: Event): void {
        event.stopPropagation(); // Предотвращаем всплытие клика на выбор изображения
        const confirmation = window.confirm("Вы уверены, что хотите удалить этот элемент?");
        if (confirmation) {
            this.http.delete(`${this.baseApiUrl}photos/${imageId}`).subscribe({
                next: () => {
                    this.eventService.emitRefreshItem();
                },
                error: (err) => {
                    console.error('Ошибка при удалении изображения:', err);
                }
            });
        }
    }
}
