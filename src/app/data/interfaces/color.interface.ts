import {Inventories} from './inventories.interface';

export interface Color{
  id: number;
  name: string
  photoIds: number[];
  inventories: Inventories[];
  item_id?: number;
}
