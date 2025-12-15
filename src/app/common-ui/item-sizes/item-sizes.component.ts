import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {Inventories} from "../../data/interfaces/inventories.interface";
import {EditModalComponent, EditModalField} from "../edit-modal/edit-modal.component";
import {EventService} from "../../data/services/event.service";
import {ActivatedRoute} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {ItemService} from "../../data/services/item.service";
import {SizeService} from "../../data/services/size.service";
import {InventoryService} from "../../data/services/inventory.service";
import {Item} from "../../data/interfaces/item.interface";
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-item-sizes',
  standalone: true,
    imports: [
        NgForOf,
        NgIf,
        EditModalComponent,
        TranslateModule
    ],
  templateUrl: './item-sizes.component.html',
  styleUrl: './item-sizes.component.scss'
})
export class ItemSizesComponent implements OnChanges {
    @Input() item: Item | null = null;
    @Input() forColor: string | null = null;
    @Input() isAdmin: boolean = false;
    @Input() selectedSize: string | null = null;
    @Output() sizeSelected = new EventEmitter<string>();

    groupedInventories: Map<string, Inventories[]> | null = null;

    constructor(
        private eventService: EventService,
        private inventoryService: InventoryService,
        private sizeService: SizeService,
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['forColor'] &&
            changes['forColor'].currentValue ||
            changes['item'] && changes['item'].currentValue
        ) {
            this.getSizes();
        }
    }


    //region for Sizes
    @ViewChild('editSizesModalRef') editSizesModalRef!: EditModalComponent;

    sizesModalTitle = 'ნაშთის/ზომის დამატება';
    sizesModalFields: EditModalField[] = [
        {
            name: 'stockCount',
            label: 'ნაშთი',
            type: 'number',
            required: true,
            placeholder: 'შეიყვანეთ საწყობის ნაშთი',
            min: 0,
            max: 99,
        },
        {
            name: 'size',
            label: 'ზომები',
            type: 'select',
            required: true,
            options: []
        }
    ];
    sizesModalData = {
        stockCount: 0,
        size: []
    };

    openSizesModal(): void {
        this.sizeService.get().subscribe({
            next: (response: any) => {
                const transformed = response
                    .map((item: any) => ({
                        id: item.id,
                        value: item.name
                    }))
                    .filter((item: any) => this.groupedInventories === null || !this.groupedInventories.has(item.value));
                if (transformed.length === 0) {
                    throw new Error("All Sizes added");
                }
                // Находим поле в sizesModalFields по имени
                const categoriesField = this.sizesModalFields.find(field => field.name === 'size');
                if (categoriesField) {
                    categoriesField.options = transformed;
                }

                // Теперь, когда options обновлены, открываем саму модалку
                // (если editSizesModalRef - это ViewChild на компонент EditModalComponent):
                this.editSizesModalRef.openModal();
            },
            error: (error: any) => {
                // console.log("error", error);
            },
        })

    }

    onSizesModalResult(editedData: any): void {
        const transformed = {
            stockCount: editedData.stockCount,
            sizeId: editedData.size.id,
            colorId: this.getColorIdByName(this.forColor!)
        };

        this.inventoryService.save(transformed).subscribe({
            next: (response: any) => {
                this.eventService.emitRefreshItem(this.item?.id, this.forColor!);
            },
            error: (error: any) => {

            }
        })
    }

    //endregion


    //region for Inventory Edit
    @ViewChild('editInventoryModalRef') editInventoryModalRef!: EditModalComponent;

    inventoryModalTitle = 'ნაშთის რედაქტირება';
    inventoryModalFields: EditModalField[] = [
        {
            name: 'stockCount',
            label: 'ნაშთი',
            type: 'number',
            required: true,
            placeholder: 'შეიყვანეთ საწყობის ნაშთი',
            min: 0,
            max: 99,
        },
        {
            name: 'size',
            label: 'ზომა',
            type: 'text',
            readonly: true,
        },
    ];
    inventoryModalData = {
        stockCount: 0,
        size: '',
        inventory_id: 0,
    };


    openInventoryModal(sizeName: string): void {
        if (this.isAdmin && this.groupedInventories && this.groupedInventories.has(sizeName)) {
            // ✅ Use .get(sizeName) instead of indexing
            let inventoryList = this.groupedInventories.get(sizeName);

            if (inventoryList && inventoryList.length > 0) {
                let inventory: Inventories = inventoryList[0]; // Get first item safely

                this.inventoryModalData.stockCount = inventory.stockCount;
                this.inventoryModalData.size = inventory.size.name;
                this.inventoryModalData.inventory_id = inventory.id;

                this.editInventoryModalRef.openModal();
            } else {
                console.warn(`Не найдены остатки для размера: ${sizeName}`);
            }
        } else {
            this.selectSize(sizeName);
        }
    }


    onInventoryModalResult(editedData: any): void {
        const transformed = {
            id: editedData.inventory_id,
            stockCount: editedData.stockCount,
        };

        this.inventoryService.update(transformed).subscribe({
            next: (response: any) => {
                this.eventService.emitRefreshItem(this.item?.id, this.forColor!);
            },
            error: (error: any) => {

            }
        });
    }

    //endregion




    getSizes() {
        if (this.item && this.forColor) {
            this.inventoryService.getInventoryForColorName(this.item, this.forColor).subscribe({
                next: (result) => {
                    this.groupedInventories = this.groupInventoriesBySize(result);
                },
                error: (err) => {
                },
                complete: () => {
                    // this.loadingService.hide();
                }
            });
        }
    }

    getColorIdByName(colorName: string) {
        // Проверяем, есть ли вообще цвета у item
        if (!this.item?.colors || this.item?.colors.length === 0) {
            return null;
        }

        // Находим объект цвета по имени
        const color = this.item.colors.find(c => c.name === colorName);

        // Если цвет найден, возвращаем его id, иначе undefined
        return color?.id;
    }

    deleteInventoryClick(sizeName: string, event: Event) {
        event.stopPropagation();
        const confirmation = window.confirm("Вы уверены, что хотите удалить этот razmer?");
        if (confirmation) {
            let inventory_id: number = -1;
            if (this.groupedInventories && this.groupedInventories.has(sizeName)) {
                let inventoryList = this.groupedInventories.get(sizeName);
                if (inventoryList && inventoryList.length > 0) {
                    let inventory: Inventories = inventoryList[0];
                    inventory_id = inventory.id;
                }
            }
            this.inventoryService.delete(inventory_id).subscribe({
                next: () => {
                    this.eventService.emitRefreshItem(this.item?.id, this.forColor!);
                },
                error: (error: any) => {
                    console.error("Ошибка при удалении элемента:", error);
                }
            });
        }
    }

    getTotalStockCount(sizeName: string): number {
        if (!this.groupedInventories || !this.groupedInventories.has(sizeName)) {
            return 0; // ✅ Return 0 if groupedInventories is null or key is missing
        }

        const inventoryList = this.groupedInventories.get(sizeName); // ✅ Use `.get()` instead of `[]`

        return inventoryList ? inventoryList.reduce((sum, inv) => sum + inv.stockCount, 0) : 0;
    }

    groupInventoriesBySize(inventories: Inventories[]): Map<string, Inventories[]> {
        // Step 1: Group inventories by size name
        const grouped = inventories.reduce((acc, inventory) => {
            const sizeName = inventory.size.name;
            if (!acc[sizeName]) acc[sizeName] = [];
            acc[sizeName].push(inventory);
            return acc;
        }, {} as Record<string, Inventories[]>);

        // Step 2: Sort entries by `size.id` in ascending order before converting to Map
        return new Map(
            Object.entries(grouped)
                .sort(([, a], [, b]) => a[0].size.id - b[0].size.id) // Sort by size.id (ascending)
        );
    }

    groupedInventoriesKeys(): string[] {
        return this.groupedInventories ? Array.from(this.groupedInventories.keys()) : [];
    }

    selectSize(sizeName: string): void {
        if (this.isAdmin) return;
        if (this.getTotalStockCount(sizeName) === 0) return;
        this.selectedSize = sizeName;
        this.sizeSelected.emit(sizeName);
    }

}
