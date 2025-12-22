import {Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {ItemService} from "../../data/services/item.service";
import {Photo} from "../../data/interfaces/photo.interface";
import {Item} from "../../data/interfaces/item.interface";
import {Color} from "../../data/interfaces/color.interface";
import {FormsModule} from "@angular/forms";
import {BASE_API_URL} from "../../app.config";
import {ColorPickerComponent} from "../../common-ui/color-picker/color-picker.component";
import {LoaderService} from "../../data/services/loader.service";
import {LoadingComponent} from "../../common-ui/loading/loading.component";
import {PhotoService} from "../../data/services/photo.service";
import {Observable, Subscription, firstValueFrom} from "rxjs";
import {EventService} from "../../data/services/event.service";
import {ItemColorsComponent} from "../../common-ui/item-colors/item-colors.component";
import {ItemSizesComponent} from "../../common-ui/item-sizes/item-sizes.component";
import {ItemVisualPanelComponent} from "../../common-ui/item-visual-panel/item-visual-panel.component";
import {ItemMetaPanelComponent} from "../../common-ui/item-meta-panel/item-meta-panel.component";
import {ItemSuggestionRailComponent} from "../../common-ui/item-suggestion-rail/item-suggestion-rail.component";
import {CartService} from "../../data/services/cart.service";
import {ShareService} from "../../data/services/share.service";
import {ShareRequest} from "../../data/interfaces/share.interface";
import {ToastService} from "../../common-ui/toast-container/toast.service";
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {ItemPurchaseBarComponent, AvailabilityState} from "../../common-ui/item-purchase-bar/item-purchase-bar.component";
import {ItemPurchaseBarService} from "../../common-ui/item-purchase-bar/item-purchase-bar.service";
import {Inventories} from "../../data/interfaces/inventories.interface";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-item-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ColorPickerComponent,
        LoadingComponent,
        ItemColorsComponent,
        ItemSizesComponent,
        ItemVisualPanelComponent,
        ItemMetaPanelComponent,
        ItemSuggestionRailComponent,
        TranslateModule,
        ItemPurchaseBarComponent
    ],
    templateUrl: './item-page.component.html',
    styleUrls: ['./item-page.component.scss']
})
export class ItemPageComponent implements OnInit, OnDestroy {
    isLoggedIn$!: Observable<boolean>;
    private refreshSubscription!: Subscription;
    private toastService = inject(ToastService);
    private purchaseBarService = inject(ItemPurchaseBarService);
    private destroyRef = inject(DestroyRef);

    baseApiUrl = inject(BASE_API_URL);
    private router = inject(Router);
    private translate = inject(TranslateService);
    item: Item | null = null;
    images: { id: string, url: string }[] = [];
    selectedImage: { id: string, url: string } | null = null;
    currentIndex: number = 0;
    currentColor: string = '#ffffff';
    selectedSize: string | null = null;
    quantity: number = 1;

    colorImageMap: { [colorName: string]: { id: string, url: string }[] } = {};
    selectedColor: string | null = null;

    similarItems: Item[] = [];
    styledItems: Item[] = [];

    shareModalOpen = false;
    sharePlatform: 'facebook' | 'instagram' | null = null;
    shareDestination: 'feed' | 'story' = 'feed';
    shareCaption = '';
    shareError = '';
    shareBusy = false;
    sharePreviewImages: string[] = [];
    compareAtPrice: number | null = null;

    constructor(
        private eventService: EventService,
        private route: ActivatedRoute,
        private http: HttpClient,
        private itemService: ItemService,
        private loadingService: LoaderService,
        private photoService: PhotoService,
        private cartService: CartService,
        private shareService: ShareService
    ) {
        this.translate.onLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.updatePurchaseBarState());
    }

    ngOnDestroy(): void {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
        this.purchaseBarService.hide();
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
                // modalData: Item | null = null;
                this.loadImagesByColor(data.colors, forColor, photoIdToSelectAfterLoad);
                this.loadSuggestions(data.id);
                this.updatePurchaseBarState();
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
            if (!color.name) {
                return;
            }

            const photoIds = Array.isArray(color.photoIds) ? color.photoIds : [];
            this.colorImageMap[color.name] = photoIds.map(photoId => ({
                id: photoId.toString(),
                url: this.photoService.getPhotoSrc(photoId),
            }));
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

        this.updatePurchaseBarState();
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



    selectColor(colorName: string): void {
        this.selectedColor = colorName;
        this.updateImagesForSelectedColor();
        this.currentColor = colorName;
        this.selectedSize = null;
        this.updatePurchaseBarState();
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
        this.updatePurchaseBarState();
    }

    private getSelectedInventory(): Inventories | undefined {
        const color = this.item?.colors?.find(c => c.name === this.selectedColor);
        return color?.inventories?.find(inv => inv.size.name === this.selectedSize);
    }

    get itemPrice(): number {
        return this.item?.price ?? 0;
    }

    get selectedStockCount(): number {
        const inventory = this.getSelectedInventory();
        return inventory?.stockCount ?? 0;
    }

    get availabilityLabel(): string {
        if (!this.selectedColor || !this.selectedSize) {
            return this.translate.instant('item_purchase.select_options');
        }

        const inventory = this.getSelectedInventory();
        if (!inventory) {
            return this.translate.instant('item_purchase.pending');
        }

        if (inventory.stockCount === 0) {
            return this.translate.instant('item_purchase.out');
        }

        if (inventory.stockCount <= 3) {
            return this.translate.instant('item_purchase.low', {count: inventory.stockCount});
        }

        return this.translate.instant('item_purchase.in', {count: inventory.stockCount});
    }

    private get availabilityLabelKey(): string {
        if (!this.selectedColor || !this.selectedSize) {
            return 'item_purchase.select_options';
        }

        const inventory = this.getSelectedInventory();
        if (!inventory) {
            return 'item_purchase.pending';
        }

        if (inventory.stockCount === 0) {
            return 'item_purchase.out';
        }

        if (inventory.stockCount <= 3) {
            return 'item_purchase.low';
        }

        return 'item_purchase.in';
    }

    get availabilityState(): AvailabilityState {
        if (!this.selectedColor || !this.selectedSize) {
            return 'pending';
        }

        const inventory = this.getSelectedInventory();
        if (!inventory) {
            return 'pending';
        }

        if (inventory.stockCount === 0) {
            return 'out';
        }

        if (inventory.stockCount <= 3) {
            return 'low';
        }

        return 'in';
    }

    get canAddToCart(): boolean {
        if (!this.selectedColor || !this.selectedSize) {
            return false;
        }

        const inventory = this.getSelectedInventory();
        if (inventory) {
            return inventory.stockCount > 0;
        }

        return true;
    }

    onQuantityChange(value: number): void {
        const normalized = Number.isFinite(value) ? Math.floor(value) : 1;
        const nextValue = normalized > 0 ? normalized : 1;
        const stockLimit = this.getSelectedInventory()?.stockCount;
        this.quantity = stockLimit && stockLimit > 0 ? Math.min(nextValue, stockLimit) : nextValue;
        this.updatePurchaseBarState();
    }

    addToCart(navigateToCart = false): boolean {
        if (!this.item || !this.item.id) return false;
        if (!this.selectedColor) {
            this.toastService.warning(
                `Выберите цвет перед добавлением в корзину.`,
                { autoClose: true, duration: 4000 }
            );
            return false;
        }
        if (!this.selectedSize) {
            this.toastService.warning(
                `Выберите размер перед добавлением в корзину.`,
                { autoClose: true, duration: 4000 }
            );
            return false;
        }

        const inventory = this.getSelectedInventory();
        if (inventory && inventory.stockCount === 0) {
            this.toastService.warning(
                `Выбранный размер закончился.`,
                { autoClose: true, duration: 4000 }
            );
            return false;
        }

        if (inventory && inventory.stockCount > 0 && this.quantity > inventory.stockCount) {
            this.quantity = inventory.stockCount;
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

        this.toastService.success(
            `Товар добавлен в корзину. Перейдите в корзину для оформления.`,
            { autoClose: true, duration: 4000 }
        );

        if (navigateToCart) {
            this.router.navigate(['/cart']).then();
        }

        this.updatePurchaseBarState();
        return true;
    }

    buyNow(): void {
        this.addToCart(true);
    }

    private updatePurchaseBarState(): void {
        if (!this.item) {
            this.purchaseBarService.hide();
            return;
        }

        const label = this.translate.instant(this.availabilityLabelKey, {count: this.selectedStockCount});

        this.purchaseBarService.setState({
            visible: !!this.item,
            price: this.itemPrice,
            compareAtPrice: this.compareAtPrice,
            availabilityLabel: label,
            availabilityState: this.availabilityState,
            quantity: this.quantity,
            canSubmit: this.canAddToCart,
            onQuantityChange: (value: number) => this.onQuantityChange(value),
            onAddToCart: () => this.addToCart(),
            onBuyNow: () => this.buyNow()
        });
    }

    openShareModal(platform: 'facebook' | 'instagram'): void {
        if (!this.item) return;
        this.sharePlatform = platform;
        this.shareDestination = 'feed';
        this.shareCaption = this.buildDefaultShareCaption();
        this.sharePreviewImages = this.getImagesForCurrentSelection();
        this.shareError = '';
        this.shareModalOpen = true;
    }

    closeShareModal(): void {
        this.shareModalOpen = false;
        this.shareBusy = false;
        this.shareError = '';
    }

    private getImagesForCurrentSelection(): string[] {
        if (this.selectedColor && this.colorImageMap[this.selectedColor]?.length) {
            return this.colorImageMap[this.selectedColor].map(img => img.url);
        }

        const firstColorWithPhotos = this.item?.colors?.find(c => this.colorImageMap[c.name]?.length);
        if (firstColorWithPhotos) {
            return this.colorImageMap[firstColorWithPhotos.name].map(img => img.url);
        }

        return [];
    }

    private buildDefaultShareCaption(): string {
        if (!this.item) return '';
        const parts: string[] = [];
        parts.push(`${this.item.name}${this.selectedColor ? ` · ${this.selectedColor}` : ''}`);
        if (this.item.description) {
            parts.push(this.item.description);
        }
        parts.push(`Цена: ${this.itemPrice.toLocaleString('ru-RU')} ₸`);
        return parts.join('\n');
    }

    trackByIndex(index: number): number {
        return index;
    }

    private getShareUrl(): string {
        if (this.item?.id) {
            const urlTree = this.router.createUrlTree(['/item', this.item.id]);
            return `${window.location.origin}${this.router.serializeUrl(urlTree)}`;
        }
        return window.location.href;
    }

    private buildShareRequest(): ShareRequest | null {
        if (!this.item || !this.sharePlatform) return null;

        return {
            platform: this.sharePlatform,
            destination: this.shareDestination,
            caption: this.shareCaption,
            url: this.getShareUrl(),
            images: this.getImagesForCurrentSelection(),
            colorName: this.selectedColor,
            itemName: this.item.name,
            description: this.item.description,
            price: this.itemPrice,
            itemId: this.item.id,
        };
    }

    private openFacebookComposer(url: string, text: string): void {
        const params = new URLSearchParams({
            u: url,
        });

        if (text) {
            params.set('quote', text);
        }

        const composerUrl = `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
        window.open(composerUrl, '_blank', 'noopener');
    }

    private async copyShareText(text: string): Promise<void> {
        if (!navigator.clipboard) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.warn('Не удалось скопировать подпись', error);
        }
    }

    private async openInstagramComposer(text: string): Promise<void> {
        await this.copyShareText(text);

        const instagramPath = this.shareDestination === 'story'
            ? 'https://www.instagram.com/create/story/'
            : 'https://www.instagram.com/create/details/';

        window.open(instagramPath, '_blank', 'noopener');
    }

    async shareItem(): Promise<void> {
        if (!this.item || this.item.id == null || !this.sharePlatform) {
            this.shareError = 'Товар не загружен или ещё не сохранён';
            return;
        }

        const shareRequest = this.buildShareRequest();
        if (!shareRequest) {
            this.shareError = 'Недостаточно данных';
            return;
        }

        // ✅ ТЕКСТ ДЛЯ CLIPBOARD — СРАЗУ
        const clipboardText = [
            shareRequest.caption,
            shareRequest.description,
            `Цена:  ₸`,
            shareRequest.url
        ]
            .filter(Boolean)
            .join('\n\n');

        // ✅ СИНХРОННО (работает в Safari)
        const copied =
            this.copyToClipboardSync(clipboardText) ||
            (navigator.clipboard
                ? await navigator.clipboard.writeText(clipboardText).then(() => true).catch(() => false)
                : false);

        if (!copied) {
            console.warn('Не удалось скопировать данные в буфер обмена');
        }

        // 🔻 ТОЛЬКО ПОСЛЕ ЭТОГО — async
        this.shareBusy = true;
        this.shareError = '';

        try {
            const response = await firstValueFrom(
                this.shareService.createItemShare(this.item.id, shareRequest)
            );

            const shareUrl = response?.shareUrl || shareRequest.url;

            // ---------- FACEBOOK ----------
            if (this.sharePlatform === 'facebook') {
                if (shareUrl.includes('localhost') || shareUrl.includes('127.0.0.1')) {
                    this.shareError =
                        'Facebook не поддерживает публикацию с localhost. ' +
                        'Текст скопирован — вставьте вручную.';
                    return;
                }

                const fbUrl =
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

                window.open(fbUrl, '_blank');
            }

            // ---------- INSTAGRAM ----------
            if (this.sharePlatform === 'instagram') {
                const instagramPath =
                    this.shareDestination === 'story'
                        ? 'https://www.instagram.com/create/story/'
                        : 'https://www.instagram.com/create/details/';

                window.open(instagramPath, '_blank');
            }

            this.closeShareModal();

        } catch {
            this.shareError = 'Не удалось подготовить публикацию';
        } finally {
            this.shareBusy = false;
        }
    }

    private copyToClipboardSync(text: string): boolean {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        } catch {
            return false;
        }
    }




}
