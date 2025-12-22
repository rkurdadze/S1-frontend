import { Component, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  AdminNewsletterDraft,
  AdminNewsletterSegment,
  AdminNewsletterSend
} from '../../../data/interfaces/admin/admin.interfaces';
import { AdminApiService } from '../../../data/services/admin-api.service';
import { ToastService } from '../../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-admin-newsletter',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-newsletter.component.html',
  styleUrl: './admin-newsletter.component.scss'
})
export class AdminNewsletterComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toastService = inject(ToastService);

  draft: AdminNewsletterDraft = { subject: '', message: '' };
  segments: AdminNewsletterSegment[] = [];
  sends: AdminNewsletterSend[] = [];
  showDraftForm = false;
  showSegmentForm = false;
  isLoading = false;
  errorMessage = '';

  segmentForm: Omit<AdminNewsletterSegment, 'id'> = {
    name: '',
    count: 0,
    description: ''
  };

  ngOnInit(): void {
    this.loadDraft();
    this.loadSegments();
  }

  saveDraft(): void {
    if (!this.draft.subject.trim()) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    this.adminApi
      .updateNewsletterDraft({
        subject: this.draft.subject.trim(),
        message: this.draft.message.trim()
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: draft => {
          this.draft = { ...draft };
          this.toastService.info('Черновик сохранён', { autoClose: true, duration: 2500 });
        },
        error: () => {
          this.errorMessage = 'Не удалось сохранить черновик. Попробуйте ещё раз.';
        }
      });
  }

  toggleDraftForm(): void {
    this.showDraftForm = !this.showDraftForm;
  }

  toggleSegmentForm(): void {
    this.showSegmentForm = !this.showSegmentForm;
  }

  sendCampaign(): void {
    if (!this.draft.subject.trim()) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    const segmentIds = this.segments.map(segment => segment.id);
    this.adminApi
      .sendNewsletter({
        subject: this.draft.subject.trim(),
        message: this.draft.message.trim(),
        segmentIds,
        test: false
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: send => {
          this.sends = [send, ...this.sends];
          this.toastService.info('Рассылка отправлена', { autoClose: true, duration: 2500 });
        },
        error: () => {
          this.errorMessage = 'Не удалось отправить рассылку. Попробуйте ещё раз.';
        }
      });
  }

  addSegment(): void {
    if (!this.segmentForm.name.trim()) {
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    this.adminApi
      .createNewsletterSegment({
        name: this.segmentForm.name.trim(),
        count: Number(this.segmentForm.count) || 0,
        description: this.segmentForm.description.trim()
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.segmentForm = { name: '', count: 0, description: '' };
          this.loadSegments();
        },
        error: () => {
          this.errorMessage = 'Не удалось сохранить сегмент. Попробуйте ещё раз.';
        }
      });
  }

  removeSegment(segment: AdminNewsletterSegment): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.adminApi
      .deleteNewsletterSegment(segment.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.loadSegments();
        },
        error: () => {
          this.errorMessage = 'Не удалось удалить сегмент. Попробуйте ещё раз.';
        }
      });
  }

  private loadDraft(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminApi
      .getNewsletterDraft()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: draft => {
          this.draft = { ...draft };
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить черновик. Попробуйте ещё раз.';
        }
      });
  }

  private loadSegments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminApi
      .getNewsletterSegments()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: segments => {
          this.segments = segments;
        },
        error: () => {
          this.errorMessage = 'Не удалось загрузить сегменты. Попробуйте ещё раз.';
        }
      });
  }
}
