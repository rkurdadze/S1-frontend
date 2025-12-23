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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-newsletter',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TranslateModule],
  templateUrl: './admin-newsletter.component.html',
  styleUrl: './admin-newsletter.component.scss'
})
export class AdminNewsletterComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  draft: AdminNewsletterDraft = { subject: '', message: '' };
  segments: AdminNewsletterSegment[] = [];
  sends: AdminNewsletterSend[] = [];
  showDraftForm = false;
  showSegmentForm = false;
  isLoading = false;

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
          this.toast.success(this.translate.instant('admin.newsletter.toast_draft_saved'));
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.newsletter.toast_draft_save_error'));
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
    const confirmation = globalThis.confirm(this.translate.instant('admin.newsletter.confirm_send'));
    if (!confirmation) {
      return;
    }

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
          this.toast.success(this.translate.instant('admin.newsletter.toast_campaign_sent'));
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.newsletter.toast_campaign_send_error'));
        }
      });
  }

  addSegment(): void {
    if (!this.segmentForm.name.trim()) {
      return;
    }

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
          this.toast.success(this.translate.instant('admin.newsletter.toast_segment_created'));
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.newsletter.toast_segment_save_error'));
        }
      });
  }

  removeSegment(segment: AdminNewsletterSegment): void {
    const confirmation = globalThis.confirm(this.translate.instant('admin.newsletter.confirm_delete_segment'));
    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.adminApi
      .deleteNewsletterSegment(segment.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.loadSegments();
          this.toast.success(this.translate.instant('admin.newsletter.toast_segment_deleted'));
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.newsletter.toast_segment_delete_error'));
        }
      });
  }

  private loadDraft(): void {
    this.isLoading = true;

    this.adminApi
      .getNewsletterDraft()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: draft => {
          this.draft = { ...draft };
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.newsletter.toast_load_draft_error'));
        }
      });
  }

  private loadSegments(): void {
    this.isLoading = true;

    this.adminApi
      .getNewsletterSegments()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: segments => {
          this.segments = segments;
        },
        error: () => {
          this.toast.error(this.translate.instant('admin.newsletter.toast_load_segments_error'));
        }
      });
  }
}
