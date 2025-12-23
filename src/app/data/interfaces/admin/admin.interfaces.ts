export interface AdminCategory {
  id: number;
  title: string;
  description: string;
  highlight: string;
  tags: string[];
}

export interface AdminNewsItem {
  id: number;
  title: string;
  date: string;
  summary: string;
  image: string;
}

export interface AdminCollection {
  id: number;
  title: string;
  tag: string;
  description: string;
  image: string;
  anchor: string;
}

export interface AdminEditorial {
  id: number;
  title: string;
  summary: string;
  image: string;
  cta: string;
}

export interface AdminPromotion {
  id: number;
  name: string;
  scope: string;
  discount: string;
  period: string;
  status: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

export interface AdminOrder {
  id: number;
  orderNumber: string;
  customer: string;
  total: string;
  status: string;
  delivery: string;
  date: string;
  address: string;
  notes: string;
  window: string;
}

export interface AdminDeliveryZone {
  id: number;
  zone: string;
  price: string;
  eta: string;
  notes: string;
}

export interface AdminNewsletterDraft {
  subject: string;
  message: string;
}

export interface AdminNewsletterSegment {
  id: number;
  name: string;
  description: string;
  count: number;
}

export interface AdminNewsletterSend {
  id: number;
  subject: string;
  sentAt: string;
  recipients: string;
}
