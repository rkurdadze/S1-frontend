import {CartItem} from './cart-item.interface';
import {ContactInfo} from './contact-info.interface';

export interface OrderPayload {
  items: CartItem[];
  contact: ContactInfo;
  deliveryOption: string;
  notes?: string;
  total: number;
  paymentToken?: string;
  userId?: string;
  emailNotification?: boolean;
}
