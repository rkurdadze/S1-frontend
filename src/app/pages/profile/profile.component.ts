import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserProfileService } from '../../data/services/user-profile.service';
import { UserProfile } from '../../data/interfaces/user-profile.interface';
import { ToastService } from '../../common-ui/toast-container/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(UserProfileService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  avatarPreview: string | null = null;
  profileForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    addressLine1: ['', [Validators.required, Validators.maxLength(160)]],
    addressLine2: ['', [Validators.maxLength(160)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    region: ['', [Validators.maxLength(80)]],
    postalCode: ['', [Validators.maxLength(20)]],
    country: ['', [Validators.required, Validators.maxLength(80)]],
  });

  constructor() {
    this.profileService.profile$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(profile => {
        this.profileForm.patchValue(profile, { emitEvent: false });
        this.avatarPreview = profile.avatarDataUrl ?? null;
      });
  }

  get profile(): UserProfile {
    return this.profileService.currentProfile;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      this.profileService.updateProfile({ avatarDataUrl: this.avatarPreview });
    };
    reader.readAsDataURL(file);
  }

  clearAvatar(): void {
    this.avatarPreview = null;
    this.profileService.updateProfile({ avatarDataUrl: null });
  }

  submit(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      return;
    }

    const updated = this.profileService.updateProfile({
      ...this.profileForm.value,
      avatarDataUrl: this.avatarPreview
    });

    this.toastService.success(
      this.translate.instant('profile_page.toasts.saved'),
      { autoClose: true, duration: 3500 }
    );

    this.profileForm.patchValue(updated, { emitEvent: false });
  }

  resetToStored(): void {
    const saved = this.profile;
    const { avatarDataUrl, ...formValue } = saved;
    this.profileForm.reset(formValue);
    this.avatarPreview = avatarDataUrl ?? null;
  }

  hasError(controlName: string, error: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!control && control.touched && control.hasError(error);
  }
}
