import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {ItemService} from "../../data/services/item.service";
import {Photo} from "../../data/interfaces/photo.interface";
import {Item} from "../../data/interfaces/item.interface";
import {Color} from "../../data/interfaces/color.interface";
import {FormsModule} from "@angular/forms";
import {EditModalComponent, EditModalField} from "../../common-ui/edit-modal/edit-modal.component";
import {BASE_API_URL} from "../../app.config";
import {ColorPickerComponent} from "../../common-ui/color-picker/color-picker.component";
import {LoaderService} from "../../data/services/loader.service";
import {LoadingComponent} from "../../common-ui/loading/loading.component";
import {PhotoService} from "../../data/services/photo.service";
import {Observable, Subscription} from "rxjs";
import {EventService} from "../../data/services/event.service";
import {ItemColorsComponent} from "../../common-ui/item-colors/item-colors.component";
import {ItemSizesComponent} from "../../common-ui/item-sizes/item-sizes.component";
import {GoogleAuthService} from "../../data/services/google-auth.service";
import {ItemVisualPanelComponent} from "../../common-ui/item-visual-panel/item-visual-panel.component";
import {ItemMetaPanelComponent} from "../../common-ui/item-meta-panel/item-meta-panel.component";
import {ItemSuggestionRailComponent} from "../../common-ui/item-suggestion-rail/item-suggestion-rail.component";
import {CartService} from "../../data/services/cart.service";

@Component({
    selector: 'app-item-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        EditModalComponent,
        ColorPickerComponent,
        LoadingComponent,
        ItemColorsComponent,
        ItemSizesComponent,
        ItemVisualPanelComponent,
        ItemMetaPanelComponent,
        ItemSuggestionRailComponent
    ],
    templateUrl: './item-page.component.html',
    styleUrls: ['./item-page.component.scss']
})
export class ItemPageComponent implements OnInit {
    isLoggedIn$: Observable<any>;
    private refreshSubscription!: Subscription;

    baseApiUrl = inject(BASE_API_URL);
    private router = inject(Router);
    item: Item | null = null;
    images: { id: string, url: string }[] = [];
    selectedImage: { id: string, url: string } | null = null;
    currentIndex: number = 0;
    currentColor: string = '#ffffff';
    selectedSize: string | null = null;
    quantity: number = 1;

    colorImageMap: { [colorName: string]: { id: string, url: string }[] } = {};
    selectedColor: string | null = null;
    photos: Photo[] = [];

    similarItems: Item[] = [];
    styledItems: Item[] = [];

    isAdmin: boolean = false;

    constructor(
        private eventService: EventService,
        private route: ActivatedRoute,
        private http: HttpClient,
        private itemService: ItemService,
        private loadingService: LoaderService,
        private photoService: PhotoService,
        private googleAuth: GoogleAuthService,
        private cartService: CartService
    ) {
        this.isLoggedIn$ = this.googleAuth.user$;
        this.isLoggedIn$.subscribe(user => {
            if (user && user.id) {
                this.isAdmin = googleAuth.isAdmin;
            } else {
                this.isAdmin = false;
            }
        });
    }

    //region for edit
    @ViewChild('editModalRef') editModalRef!: EditModalComponent;

    modalTitle = 'რედაქტირება';
    modalFields: EditModalField[] = [
        {
            name: 'name',
            label: 'დასახელება',
            type: 'text',
            required: true,
            placeholder: 'შეიყვანეთ დასახელება',
            maxLength: 200,
        },
        {
            name: 'description',
            label: 'აღწერილობა',
            type: 'textarea',
            placeholder: 'შეიყვანეთ აღწერილობა',
            maxLength: 1000,
        },
        {
            name: 'publish',
            label: 'გამოქვეყნება',
            type: 'checkbox',
        }
    ];
    modalData = {};

    openModal(): void {
        this.editModalRef.openModal();
    }

    onModalResult(editedData: any): void {
        this.itemService.save(editedData).subscribe({
            next: (response: any) => {
                if (this.item?.id) {
                    this.loadItem(
                        String(this.item.id),
                        this.selectedColor?.toString(),
                        this.selectedImage?.id ? Number(this.selectedImage.id) : undefined
                    );
                }
            },
            error: (error: any) => {

            }
        })
    }

    //endregion


    deleteItem() {
        if (!this.item || !this.item.id) return;

        const confirmation = window.confirm("Вы уверены, что хотите удалить этот элемент?");

        if (confirmation) {
            this.itemService.delete(this.item.id).subscribe({
                next: () => {
                    this.router.navigate(['/']); // ✅ Перенаправление после удаления
                },
                error: (error: any) => {
                    console.error("Ошибка при удалении элемента:", error);
                }
            });
        }
    }


    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const itemId = params.get('id');
            if (itemId) {
                this.images = [];
                this.selectedImage = null;
                this.loadItem(itemId);
            }
        });

        // Прокрутка страницы наверх при каждом открытии компонента
        window.scrollTo({ top: 0, behavior: 'smooth' });

        this.refreshSubscription = this.eventService.refresh$.subscribe(event => {
            if (event) {
                const targetId = event.id ?? this.item?.id;
                if (targetId) {
                    this.loadItem(
                        String(targetId),
                        event.selectedColorHex ?? this.selectedColor ?? undefined
                    );
                }
            }
        });

    }


    loadItem(id: string, forColor?: string, photoIdToSelectAfterLoad?: number): void {
        // console.log("load item", "item-page");
        this.loadingService.show();
        this.http.get<Item>(`${this.baseApiUrl}items/${id}`).subscribe({
            next: (data) => {
                this.item = data;
                this.quantity = 1;
                this.selectedSize = null;
                this.modalData = data;
                this.loadImagesByColor(data.colors, forColor, photoIdToSelectAfterLoad);
                this.loadSuggestions(data.id);
            },
            error: (error) => {
                console.error('Ошибка загрузки данных:', error)
            },
            complete: () => {
                this.loadingService.hide();
            }
        });
    }

    loadImagesByColor(colors: Color[], colorToActivate?: string, photoToActivate?: number): void {
        this.colorImageMap = {};
        colors.forEach(color => {
            if (color.name && Array.isArray(color.photoIds)) {
                this.colorImageMap[color.name] = color.photoIds.map(photoId => ({
                    id: photoId.toString(),
                    url: this.photoService.getPhotoSrc(photoId),
                }));
            }
        });

        // Если передан `colorToActivate`, добавляем его в карту цветов, если он отсутствует
        if (colorToActivate) {
            if (!this.colorImageMap[colorToActivate]) {
                this.colorImageMap[colorToActivate] = [];
            }
            this.selectColor(colorToActivate);
        } else if (colors.length > 0) {
            this.selectedColor = colors[0].name;
            this.updateImagesForSelectedColor();
        }


        if (photoToActivate) {
            const img = {
                id: photoToActivate.toString(),
                url: this.photoService.getPhotoSrc(photoToActivate),
            };
            this.selectImage(img);
        }
    }

    private loadSuggestions(currentId?: number): void {
        this.itemService.getItems().subscribe({
            next: (items) => {
                const filtered = items.filter(it => it.id !== currentId);
                this.similarItems = filtered.slice(0, 4);
                this.styledItems = filtered.slice(4, 8);
            },
            error: (error) => console.error('Не удалось загрузить подборки', error)
        });
    }

    get showImageControls(): boolean {
        return this.getImageCount(this.selectedColor || '') !== null &&
            this.getImageCount(this.selectedColor || '') !== undefined &&
            this.getImageCount(this.selectedColor || '') > 1;
    }

    onImageSelected(event: Event): void {
        this.loadingService.show();
        const input = event.target as HTMLInputElement;
        if (!input.files || !this.selectedColor || !this.item) return;

        const files = Array.from(input.files);
        // Очищаем перед загрузкой новых изображений
        this.photos = [];
        // Обрабатываем все файлы асинхронно
        Promise.all(files.map(file => this.readFileAsBase64(file))).then(newPhotos => {
            this.photos = newPhotos;
            this.saveImages(); // Загружаем только после полной обработки файлов
        });
        // Очистка input, чтобы можно было загрузить те же файлы заново
        input.value = "";
    }

    // Асинхронный метод для чтения файлов
    private readFileAsBase64(file: File): Promise<Photo> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                resolve({
                    name: file.name,
                    image: e.target.result, // Base64
                    colorName: this.selectedColor!,
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }


    saveImages(): void {
        if (this.photos.length === 0 || !this.item || !this.item.id) {
            console.error('Нет изображений или ID элемента не задан.');
            return;
        }

        const itemId = this.item.id;

        this.itemService.saveImages(this.photos, itemId).subscribe({
            next: (response: any) => {
                this.loadItem(String(itemId), this.selectedColor!, response[response.length - 1].id);
            },
            error: (err: any) => {
                console.error('Ошибка загрузки изображений:', err);
                alert('Ошибка загрузки изображений');
            }
        });
    }

    selectColor(colorName: string): void {
        if (colorName in this.colorImageMap) {
            this.selectedColor = colorName;
            this.updateImagesForSelectedColor();
        }
        this.currentColor = colorName;
        this.selectedSize = null;
    }

    updateImagesForSelectedColor(): void {
        if (this.selectedColor && this.colorImageMap[this.selectedColor]) {
            this.images = [...this.colorImageMap[this.selectedColor]];
            this.selectedImage = this.images.length > 0 ? this.images[0] : null;
            this.currentIndex = 0;
            this.currentColor = this.selectedColor;
        } else {
            this.images = [];
            this.selectedImage = null;
            this.currentIndex = 0;
        }
    }

    getImageCount(colorName: string): number {
        return this.colorImageMap[colorName]?.length || 0;
    }

    selectImage(image: { id: string, url: string }): void {
        this.selectedImage = image;
        this.currentIndex = this.images.findIndex(img => img.id === image.id);
    }

    prevImage(): void {
        if (this.images.length > 0) {
            this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
            this.selectedImage = this.images[this.currentIndex];
        }
    }

    nextImage(): void {
        if (this.images.length > 0) {
            this.currentIndex = (this.currentIndex + 1) % this.images.length;
            this.selectedImage = this.images[this.currentIndex];
        }
    }

    onSizeSelected(sizeName: string): void {
        this.selectedSize = sizeName;
    }

    get itemPrice(): number {
        return this.item?.price ?? 0;
    }

    onQuantityChange(value: number): void {
        this.quantity = value > 0 ? value : 1;
    }

    addToCart(): void {
        if (!this.item || !this.item.id) return;
        if (!this.selectedColor) {
            alert('Выберите цвет перед добавлением в корзину.');
            return;
        }
        if (!this.selectedSize) {
            alert('Выберите размер перед добавлением в корзину.');
            return;
        }

        this.cartService.addItem({
            itemId: this.item.id,
            name: this.item.name,
            colorName: this.selectedColor,
            sizeName: this.selectedSize,
            quantity: this.quantity,
            price: this.itemPrice,
            photoId: this.selectedImage ? Number(this.selectedImage.id) : undefined,
            item: this.item
        });

        alert('Товар добавлен в корзину. Перейдите в корзину для оформления.');
    }
}
