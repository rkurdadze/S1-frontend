import {Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {ColorPickerComponent} from "../color-picker/color-picker.component";
import {AsyncPipe, NgForOf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Color} from "../../data/interfaces/color.interface";
import {EventService} from "../../data/services/event.service";
import {ItemService} from "../../data/services/item.service";
import {ToastService} from "../toast-container/toast.service";
import {TranslateModule} from "@ngx-translate/core";

@Component({
    selector: 'app-item-colors',
    standalone: true,
    imports: [
        ColorPickerComponent,
        NgForOf,
        FormsModule,
        AsyncPipe,
        TranslateModule
    ],
    templateUrl: './item-colors.component.html',
    styleUrl: './item-colors.component.scss'
})
export class ItemColorsComponent implements OnChanges {
    @Input() colors?: Color[] = [];
    @Input() itemId!: number;
    @Input() isAdmin: boolean = false;
    @Input() activeColor?: string | null;
    @Output() selectedColorEmitter = new EventEmitter<string>();

    private toastService = inject(ToastService);

    currentlyPickedColor: string = "#e300ff";
    selectedColor: string | null = null;
    colorImagesCount: { [colorName: string]: { id: string}[] } = {};


    constructor(
        private eventService: EventService,
        private itemService: ItemService,
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['colors'] && changes['colors'].currentValue) {
            this.loadImagesCounter(this.colors!);
        }

        if (changes['activeColor'] && changes['activeColor'].currentValue) {
            this.selectedColor = changes['activeColor'].currentValue;
            this.currentlyPickedColor = this.selectedColor!;
        } else if (changes['colors'] && changes['colors'].currentValue && !this.selectedColor) {
             // Default fallback if no activeColor is provided
             if (this.colors && this.colors.length > 0) {
                 this.selectColor(this.colors[0].name);
             }
        }
    }

    selectColor(colorName: string): void {
        this.selectedColor = colorName;
        this.currentlyPickedColor = this.selectedColor;
        this.selectedColorEmitter.emit(this.selectedColor);
    }

    addColor() {
        if (this.currentlyPickedColor && typeof this.currentlyPickedColor === 'string') {
            const colorHex = this.currentlyPickedColor.trim().toLowerCase();
            const colorObject = {
                name: colorHex, // Здесь укажите нужный цвет в формате HEX
                item_id: this.itemId
            };
            this.itemService.addColors([colorObject]).subscribe({
                next: (response) => {
                    this.toastService.success('Цвет добавлен');
                    this.eventService.emitRefreshItem(this.itemId, colorHex);
                    this.selectColor(colorHex);
                },
                error: (err) => {
                    console.error('Ошибка при сохранении цветов:', err);
                    this.toastService.error('Не удалось добавить цвет');
                }
            });
        }
    }

    editColor() {
        if (this.currentlyPickedColor && typeof this.currentlyPickedColor === 'string') {
            const colorHex = this.currentlyPickedColor.trim().toLowerCase();
            const colorObject = {
                name: colorHex, // Здесь укажите нужный цвет в формате HEX
                item_id: this.itemId
            };

            const confirmation = globalThis.confirm("Вы уверены, что хотите изменить этот элемент?");
            if (confirmation) {
                let color_id = this.getColorIdByName(this.selectedColor);
                if (color_id) {
                    this.itemService.editColor(color_id, colorObject).subscribe({
                        next: (response) => {
                            this.toastService.success('Цвет обновлен');
                            this.eventService.emitRefreshItem(this.itemId, colorHex);
                            this.selectColor(colorHex);
                        },
                        error: (err) => {
                            console.error('Ошибка при сохранении цветов:', err);
                            this.toastService.error('Не удалось обновить цвет');
                        }
                    });
                }
            }
        }
    }

    removeColor(): void {
        const colorObject = {
            name: this.selectedColor!, // Здесь укажите нужный цвет в формате HEX
            item_id: this.itemId
        };

        const confirmation = globalThis.confirm("Вы уверены, что хотите удалить этот цвет?");
        if (confirmation) {
            this.itemService.removeColor(colorObject).subscribe({
                next: () => {
                    this.toastService.success('Цвет удален');
                    if (this.colors){
                        const index = this.colors.findIndex(c => c.name === colorObject.name);

                        if (index === 0 && this.colors.length > 1) {
                            // Если удаляемый цвет первый и есть второй — выбираем его
                            this.selectColor(this.colors[1].name);
                        } else {
                            // В остальных случаях выбираем первый цвет
                            this.selectColor(this.colors[0].name);
                        }
                    }

                    this.eventService.emitRefreshItem(this.itemId);
                },
                error: (err) => {
                    console.error('Ошибка при удалении color:', err);
                    this.toastService.error('Не удалось удалить цвет');
                }
            });
        }
    }

    getImagesCount(colorName: string): number {
        return this.colorImagesCount[colorName]?.length || 0;
    }

    loadImagesCounter(colors: Color[]): void {
        this.colorImagesCount = {};
        colors.forEach(color => {
            if (color.name && Array.isArray(color.photoIds)) {
                this.colorImagesCount[color.name] = color.photoIds.map(photoId => ({
                    id: photoId.toString()
                }));
            }
        });
    }

    getColorIdByName(colorName: string | null) {
        // Проверяем, есть ли вообще цвета у item
        if (!this.colors || this.colors.length === 0) {
            return null;
        }

        // Находим объект цвета по имени
        const color = this.colors.find(c => c.name === colorName);

        // Если цвет найден, возвращаем его id, иначе undefined
        return color?.id;
    }


}
