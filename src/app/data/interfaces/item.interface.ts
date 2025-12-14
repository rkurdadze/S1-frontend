import {Color} from './color.interface';

export interface Item {
  id?: number;
  name: string;
  description: string;
  price?: number;
  publish: boolean;
  colors: Color[];
}
