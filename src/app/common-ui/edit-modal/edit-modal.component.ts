import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    Output,
    PLATFORM_ID,
    ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
/**
 * Интерфейс поля редактирования.
 * Здесь можно добавлять любые дополнительные настройки.
 */
export interface EditModalField {
    name: string;                  // Имя свойства
    label: string;                 // Текст метки
    type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox' | 'multiselect';

    // validators
    required?: boolean;            // Обязательное поле
    min?: number;                  // Минимум (для number)
    max?: number;                  // Максимум (для number)
    minLength?: number;            // Минимальная длина (для text/textarea)
    maxLength?: number;            // Максимальная длина (для text/textarea)
    pattern?: string;              // Регулярное выражение (для text/textarea)

    placeholder?: string;
    /**
     * Теперь опции представляют собой объекты вида { id: number, value: string }
     */
    options?: { id: number; value: string }[];
    readonly?: boolean;
}


@Component({
    selector: 'app-edit-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './edit-modal.component.html',
    styleUrls: ['./edit-modal.component.scss']
})
export class EditModalComponent implements AfterViewInit, OnDestroy {
    @ViewChild('editModal') sizeModal!: ElementRef<HTMLDivElement>;

    @Input() title: string = 'Редактирование';
    @Input() fields: EditModalField[] = [];
    @Input() initialData: any = {};

    @Output() modalResult = new EventEmitter<any>();

    formData: any = {};

    private modalInstance: any;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    // ngAfterViewInit(): void {
    //     if (isPlatformBrowser(this.platformId)) {
    //         import('bootstrap/js/dist/modal').then(({ default: Modal }) => {
    //             this.modalInstance = new Modal(this.sizeModal.nativeElement, {
    //                 backdrop: true,
    //                 keyboard: true,
    //                 rootElement: document.body // Ensure modal is appended directly to body
    //             });
    //
    //             this.sizeModal.nativeElement.addEventListener('hide.bs.modal', () => {
    //                 this.onModalHide();
    //             });
    //         });
    //     }
    // }

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            import('bootstrap/js/dist/modal').then(({ default: Modal }) => {

                // 👇 вручную переносим modal в body
                document.body.appendChild(this.sizeModal.nativeElement);

                this.modalInstance = new Modal(this.sizeModal.nativeElement, {
                    backdrop: true,
                    keyboard: true
                });

                this.sizeModal.nativeElement.addEventListener('hide.bs.modal', () => {
                    this.onModalHide();
                });
            });
        }
    }


    openModal(): void {
        this.formData = { ...this.initialData };
        if (this.modalInstance) {
            this.modalInstance.show();
        }
    }

    onOk(): void {
        if (this.modalInstance) {
            this.modalInstance.hide();
        }
        if (this.initialData.hasOwnProperty('passThroughData')) {
            this.formData = {...this.formData, passThroughData: this.initialData.passThroughData};
        }

        this.modalResult.emit(this.formData);
    }

    onCancel(): void {
        if (this.modalInstance) {
            this.modalInstance.hide();
        }
    }

    onModalHide(): void {
        // ...
    }

    getFieldId(fieldName: string): string {
        return `modal-field-${fieldName}`;
    }


    toggleSelection(fieldName: string, option: { id: number; value: string }, checked: boolean): void {
        const selectedOptions = this.formData[fieldName] || [];

        if (checked) {
            // Добавляем опцию, если её ещё нет
            if (!selectedOptions.some((o: any) => o.id === option.id)) {
                selectedOptions.push(option);
            }
        } else {
            // Удаляем, если такая опция уже присутствует
            const idx = selectedOptions.findIndex((o: any) => o.id === option.id);
            if (idx !== -1) {
                selectedOptions.splice(idx, 1);
            }
        }
        this.formData[fieldName] = selectedOptions;
    }


    isOptionSelected(fieldName: string, opt: { id: number; value: string }): boolean {
        const arr = this.formData[fieldName];
        return Array.isArray(arr) && arr.some((o: any) => o.id === opt.id);
    }


    ngOnDestroy(): void {
        if (this.modalInstance && typeof this.modalInstance.dispose === 'function') {
            this.modalInstance.dispose();
        }
    }
}
