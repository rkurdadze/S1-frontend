import { Pipe, PipeTransform } from '@angular/core';
import {Color} from "../data/interfaces/color.interface";

@Pipe({
    standalone: true,
    name: 'colorTransform'
})
export class ColorTransformPipe implements PipeTransform {
    transform(colors: Color[], itemId: number): { name: string; item_id: number }[] {
        return colors.map(color => ({
            name: color.name,
            item_id: itemId
        }));
    }
}
