import {Component, ElementRef, HostListener, AfterViewInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-color-picker',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './color-picker.component.html',
    styleUrls: ['./color-picker.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: ColorPickerComponent,
        multi: true
    }]
})
export class ColorPickerComponent implements ControlValueAccessor, AfterViewInit {
    @ViewChild('colorCanvas') colorCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('colorPalette') colorPalette!: ElementRef;
    @ViewChild('nativePicker') nativePicker!: ElementRef;

    selectedColor: string = '#ffffff';
    showPicker: boolean = false;
    hue: number = 0;
    selectorX: number = -5;
    selectorY: number = -5;
    isDragging: boolean = false;
    ctx: CanvasRenderingContext2D | null = null;

    private onChange: (color: string) => void = () => {
    };
    private onTouched: () => void = () => {
    };
    disabled: boolean = false;

    ngAfterViewInit(): void {
        this.initCanvas();
    }

    private initCanvas(): void {
        if (!this.colorCanvas?.nativeElement) return;

        const canvas = this.colorCanvas.nativeElement;
        this.ctx = canvas.getContext('2d');

        if (!this.ctx) {
            console.error('Failed to get 2D context');
            return;
        }

        canvas.width = 200;
        canvas.height = 150;
        this.drawColorPalette();
    }

    private drawColorPalette(): void {
        if (!this.ctx) return;

        const canvas = this.colorCanvas.nativeElement;

        // Horizontal gradient (saturation)
        const satGradient = this.ctx.createLinearGradient(0, 0, canvas.width, 0);
        satGradient.addColorStop(0, '#fff');
        satGradient.addColorStop(1, `hsl(${this.hue}, 100%, 50%)`);

        // Vertical gradient (lightness)
        const lightGradient = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
        lightGradient.addColorStop(0, 'rgba(0,0,0,0)');
        lightGradient.addColorStop(1, 'rgba(0,0,0,1)');

        // Combine gradients
        this.ctx.fillStyle = satGradient;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.ctx.fillStyle = lightGradient;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ControlValueAccessor methods
    writeValue(color: string): void {
        if (color) {
            this.selectedColor = color;

            // Convert HEX to HSL and update selector position
            const hsl = this.hexToHsl(color);
            if (hsl) {
                this.hue = hsl.h;
                this.updateSelectorFromHsl(hsl);
            }
        }
    }

    registerOnChange(fn: (color: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // Rest of the component methods
    togglePicker(): void {
        this.showPicker = !this.showPicker;
    }

    startDragging(event: MouseEvent | TouchEvent): void {
        this.isDragging = true;
        this.updateSelectorPosition(event);
    }

    @HostListener('document:mousemove', ['$event'])
    @HostListener('document:touchmove', ['$event'])
    onDrag(event: MouseEvent | TouchEvent) {
        if (!this.isDragging) return;
        this.updateSelectorPosition(event);
    }

    @HostListener('document:mouseup')
    @HostListener('document:touchend')
    stopDragging() {
        this.isDragging = false;
    }


    updateSelectorPosition(event: MouseEvent | TouchEvent) {
        const rect = this.colorPalette.nativeElement.getBoundingClientRect();
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

        // Apply offset compensation without breaking bounds checks
        let x = clientX - rect.left;
        let y = clientY - rect.top;

        // Apply offset while maintaining valid range
        x = Math.max(0, Math.min(x, rect.width));
        y = Math.max(0, Math.min(y, rect.height));

        this.selectorX = x - 5;
        this.selectorY = y - 5;
        this.calculateColor();
    }

    // Update the calculateColor method
    calculateColor() {
        const x = (this.selectorX + 5) / this.colorCanvas.nativeElement.width;
        const y = (this.selectorY + 5) / this.colorCanvas.nativeElement.height;

        const saturation = x * 100; // Convert to percentage
        const lightness = (1 - y) * 100 * (1 - saturation / 200); // Lightness depends on saturation

        this.selectedColor = this.hslToHex(this.hue, saturation, lightness);
        this.onChange(this.selectedColor);
    }

    private hslToHex(h: number, s: number, l: number): string {
        h = h % 360;
        s = Math.max(0, Math.min(s, 100));
        l = Math.max(0, Math.min(l, 100));

        const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l / 100 - c / 2;

        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (60 <= h && h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (120 <= h && h < 180) {
            [r, g, b] = [0, c, x];
        } else if (180 <= h && h < 240) {
            [r, g, b] = [0, x, c];
        } else if (240 <= h && h < 300) {
            [r, g, b] = [x, 0, c];
        } else if (300 <= h && h < 360) {
            [r, g, b] = [c, 0, x];
        }

        return `#${[r, g, b]
            .map(channel => Math.round((channel + m) * 255)
                .toString(16)
                .padStart(2, '0'))
            .join('')}`;
    }

    // Convert HEX to HSL
    private hexToHsl(hex: string): { h: number; s: number; l: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;

        const r = parseInt(result[1], 16) / 255;
        const g = parseInt(result[2], 16) / 255;
        const b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0,
            s = 0,
            l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    }

    // Update selector position from HSL
    private updateSelectorFromHsl(hsl: { h: number; s: number; l: number }): void {
        if (!this.colorCanvas?.nativeElement) return;

        const canvas = this.colorCanvas.nativeElement;
        const width = canvas.width;
        const height = canvas.height;

        // Calculate selector position
        this.selectorX = (hsl.s / 100) * width - 5; // Saturation maps to x-axis

        // Lightness depends on saturation
        const lightnessFactor = 1 - hsl.s / 200; // Same as in calculateColor
        this.selectorY = (1 - hsl.l / (100 * lightnessFactor)) * height - 5; // Lightness maps to y-axis (inverted)

        // Update hue
        this.hue = hsl.h;

        // Redraw canvas with new hue
        this.drawColorPalette();
    }

    updateColorFromHue() {
        this.drawColorPalette();
        this.calculateColor();
    }

    updateFromNative() {
        this.onChange(this.selectedColor);
    }


    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        event.stopPropagation();
    }

    @HostListener('document:click')
    closePicker() {
        this.showPicker = false;
    }
}