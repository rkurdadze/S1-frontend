import { Item } from '../data/interfaces/item.interface';
import { Size } from '../data/interfaces/size.interface';
import {Color} from '../data/interfaces/color.interface';


export class ItemHelpers {

  static getUniqueSizes(item: Item, forColor?: string | null): Size[] {
    const sizes: Size[] = item.colors
        .filter(color => !forColor || color.name === forColor) // Фильтруем по forColor, если передан
        .flatMap(color =>
            color.inventories.flatMap(inv =>
                Array.isArray(inv.size) ? inv.size : [inv.size] // Гарантируем, что size всегда массив
            )
        )
        .filter(size => size !== undefined); // Удаляем undefined


    // Удаляем дубликаты по `size.id` и сортируем по `id`
    return sizes
        .filter((size, index, self) => index === self.findIndex(s => s.id === size.id))
        .sort((a, b) => a.id - b.id);
  }


  /**
   * Determines if the specified size is out of stock for the given item.
   *
   * @param item - The item to check.
   * @param size - The size to check for stock availability.
   * @returns `true` if the size is out of stock; otherwise, `false`.
   */
  static isOutOfStock(item: Item, size: Size): boolean {
    const sizeId = size.id;

    const inStock = item.colors.some(color =>
      color.inventories.some(inv => {
        let sizes: Size[] = [];

        if (Array.isArray(inv.size)) {
          sizes = inv.size;
        } else if (inv.size && typeof inv.size === 'object') {
          sizes = [inv.size];
        }

        return sizes.some(s => s.id === sizeId) && inv.stockCount > 0;
      })
    );

    return !inStock;
  }


  static isColorOutOfStock(color: Color): boolean {
    return color.inventories.every(inv => inv.stockCount === 0);
  }


  /**
   * Example of another helper function: Get total stock count for an item
   * @param item The item containing inventories
   * @returns Total stock count across all inventories
   */
  static getTotalStock(item: Item): number {
    return item.colors.reduce((total, color) =>
      total + color.inventories.reduce((sum, inv) => sum + inv.stockCount, 0), 0
    );
  }


}
