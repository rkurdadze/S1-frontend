import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {ColorPickerComponent} from "../color-picker/color-picker.component";
import {AsyncPipe, NgForOf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Color} from "../../data/interfaces/color.interface";
import {EventService} from "../../data/services/event.service";
import {ItemService} from "../../data/services/item.service";

@Component({
    selector: 'app-item-colors',
    standalone: true,
    imports: [
        ColorPickerComponent,
        NgForOf,
        FormsModule,
        AsyncPipe
    ],
    templateUrl: './item-colors.component.html',
    styleUrl: './item-colors.component.scss'
})
export class ItemColorsComponent implements OnChanges {
    @Input() colors?: Color[] = [];
    @Input() itemId!: number;
    @Input() isAdmin: boolean = false;
    @Output() selectedColorEmitter = new EventEmitter<string>();

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
            if (changes['colors'].previousValue === null &&
                changes['colors'] &&
                changes['colors'].currentValue &&
                changes['colors'].currentValue[0]) {
                this.selectColor(changes['colors'].currentValue[0].name);
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
                    this.eventService.emitRefreshItem(this.itemId, colorHex);
                    this.selectColor(colorHex);
                },
                error: (err) => {
                    console.error('Ошибка при сохранении цветов:', err);
                    alert('Ошибка при сохранении цветов');
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

            const confirmation = globalThis.confirm("Вы уверены, что хотите change этот элемент?");
            if (confirmation) {
                let color_id = this.getColorIdByName(this.selectedColor);
                if (color_id) {
                    this.itemService.editColor(color_id, colorObject).subscribe({
                        next: (response) => {
                            this.eventService.emitRefreshItem(this.itemId, colorHex);
                            this.selectColor(colorHex);
                        },
                        error: (err) => {
                            console.error('Ошибка при сохранении цветов:', err);
                            alert('Ошибка при сохранении цветов');
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

        const confirmation = globalThis.confirm("Вы уверены, что хотите удалить этот color?");
        if (confirmation) {
            this.itemService.removeColor(colorObject).subscribe({
                next: () => {
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
