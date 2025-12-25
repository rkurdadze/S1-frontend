import {CartItem} from './cart-item.interface';

export interface Region {
  id: number;
  name_en: string;
  name_ka: string;
  name_ru: string;
  latitude?: number;
  longitude?: number;
}

export interface City {
  id: number;
  name: string;
  name_en?: string;
  name_ru?: string;
}

export interface Municipality {
  id: number;
  name: string;
  name_en?: string;
  name_ka?: string;
  name_ru?: string;
  region_id?: number;
}

export interface Village {
  id: number;
  name: string;
  name_en?: string;
  name_ka?: string;
  name_ru?: string;
  municipality_id?: number;
}

export interface PudoCity {
  id: number;
  name: string;
  name_en?: string;
  name_ru?: string;
}

export interface PudoPoint {
  id: number;
  city_id: number;
  pudo_id: number;
  name_ka: string;
  city_name: string;
  latitude?: number;
  longitude?: number;
  city?: string;
}

export type AddressType = 'SENDER' | 'RECEIVER';

export interface Address {
  id: number;
  type: AddressType;
  address: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  state?: string;
  city?: string | City;
  city_id?: number;
}

export type PickupOrDeliveryMethod = 'COURIER' | 'PUDO';
export type DeliveryPayer = 'SENDER' | 'RECEIVER';
export type DeliveryPaymentType = 'CASH' | 'CASHLESS';

export interface CreateOrderDto {
  pickup_method: PickupOrDeliveryMethod;
  delivery_method: PickupOrDeliveryMethod;
  sender_address_id?: number;
  receiver_address_id?: number;
  pickup_pudo_id?: number;
  delivery_pudo_id?: number;
  sender_phone_number: string;
  receiver_phone_number: string;
  receiver_name: string;
  weight: number;
  items_quantity: number;
  cod?: boolean;
  cod_amount?: number;
  payer: DeliveryPayer;
  payment_type: DeliveryPaymentType;
  fragile?: boolean;
  to_have_picture?: boolean;
  insured?: boolean;
  description?: string;
  return_decision?: string;
  return_pudo_id?: number;
  items?: CartItem[];
}

export interface DeliveryOrder {
  id?: number;
  order_id?: number;
  tracking_code?: string;
  current_status_text?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  sender?: any;
  receiver?: any;
  billing?: any;
  return?: any;
  payer?: DeliveryPayer;
  payment_type?: DeliveryPaymentType;
  delivery_method?: PickupOrDeliveryMethod;
  pickup_method?: PickupOrDeliveryMethod;
  weight?: number;
  items_quantity?: number;
  cod?: boolean;
  cod_amount?: number;
  cost?: number;
  additional?: Record<string, any>;
}

export interface DeliveryServiceSetting {
  service: string;
  enabled: boolean;
  label?: string;
}