import {Color} from './color.interface';

export interface Item {
  id?: number;
  name: string;
  description: string;
  publish: boolean;
  colors: Color[];
}
