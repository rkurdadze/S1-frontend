import {Item} from './item.interface';

export interface CartItem {
  itemId: number;
  name: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  price: number;
  photoId?: number | null;
  item?: Item;
}
