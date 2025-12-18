import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GoogleAuthService } from './google-auth.service';
import { UserProfile } from '../interfaces/user-profile.interface';

const EMPTY_PROFILE: UserProfile = {
  displayName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  avatarDataUrl: null
};

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly storageKey = 'userProfile';
  private readonly googleAuth = inject(GoogleAuthService);

  private readonly profileSubject = new BehaviorSubject<UserProfile>(this.loadProfile());
  readonly profile$ = this.profileSubject.asObservable();

  constructor() {
    this.googleAuth.user$.subscribe(user => {
      if (!user) {
        return;
      }

      const current = this.profileSubject.getValue();
      const merged: UserProfile = {
        ...EMPTY_PROFILE,
        ...current,
        displayName: current.displayName || user.name || user.user?.username || '',
        firstName: current.firstName || user.given_name || '',
        lastName: current.lastName || user.family_name || '',
        email: current.email || user.email || '',
        avatarDataUrl: current.avatarDataUrl || user.picture || current.avatarDataUrl || null
      };

      this.setProfile(merged);
    });
  }

  get currentProfile(): UserProfile {
    return this.profileSubject.getValue();
  }

  updateProfile(patch: Partial<UserProfile>): UserProfile {
    const nextProfile: UserProfile = {
      ...this.profileSubject.getValue(),
      ...patch
    };

    this.setProfile(nextProfile);
    return nextProfile;
  }

  clearProfile(): void {
    this.setProfile(EMPTY_PROFILE);
  }

  private setProfile(profile: UserProfile): void {
    this.profileSubject.next(profile);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
  }

  private loadProfile(): UserProfile {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return {
          ...EMPTY_PROFILE,
          ...JSON.parse(saved)
        };
      }
    } catch {
      // ignore storage errors
    }

    const user = this.googleAuth.currentUser;
    if (user) {
      return {
        ...EMPTY_PROFILE,
        displayName: user.name || user.user?.username || '',
        firstName: user.given_name || '',
        lastName: user.family_name || '',
        email: user.email || '',
        avatarDataUrl: user.picture || null
      };
    }

    return EMPTY_PROFILE;
  }
}
