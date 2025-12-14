import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-item-visual-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-visual-panel.component.html',
  styleUrls: ['./item-visual-panel.component.scss']
})
export class ItemVisualPanelComponent {
  @Input() images: { id: string; url: string }[] = [];
  @Input() selectedImage: { id: string; url: string } | null = null;
  @Input() selectedColor: string | null = null;
  @Input() showImageControls: boolean = false;
  @Input() isAdmin: boolean = false;

  @Output() selectImage = new EventEmitter<{ id: string; url: string }>();
  @Output() prevImage = new EventEmitter<void>();
  @Output() nextImage = new EventEmitter<void>();

  trackById(_: number, image: { id: string; url: string }): string {
    return image.id;
  }
}
