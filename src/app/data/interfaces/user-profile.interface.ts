import { ContactInfo } from './contact-info.interface';

export interface UserProfile extends ContactInfo {
  displayName: string;
  avatarDataUrl?: string | null;
}
