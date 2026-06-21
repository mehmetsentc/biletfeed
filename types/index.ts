export type UserRole =
  | 'ROLE_USER'
  | 'ROLE_ORGANIZER'
  | 'ROLE_ADMIN'
  | 'ROLE_SUPER_ADMIN';

export type EventStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'cancelled'
  | 'completed';

export type OrganizerStatus = 'pending' | 'approved' | 'suspended';

export type TicketType =
  | 'general'
  | 'vip'
  | 'early_bird'
  | 'backstage'
  | 'student'
  | 'custom';

export type TicketStatus = 'active' | 'paused' | 'sold_out';

export type PurchasedTicketStatus =
  | 'VALID'
  | 'USED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export type EventType =
  | 'concert'
  | 'festival'
  | 'theatre'
  | 'sports'
  | 'workshop'
  | 'online'
  | 'other';

export type Currency = 'TRY' | 'USD' | 'EUR';

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends Timestamps {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organizerId?: string;
  favorites: string[];
  following: string[];
}

export interface Organizer extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo?: string;
  coverImage?: string;
  status: OrganizerStatus;
  ownerId: string;
  followerCount: number;
  commissionRate: number;
  socialLinks: Record<string, string>;
}

export interface City extends Timestamps {
  id: string;
  slug: string;
  name: string;
  country: string;
  image?: string;
  eventCount: number;
}

export interface Category extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  eventCount: number;
}

export interface Venue extends Timestamps {
  id: string;
  slug: string;
  name: string;
  address: string;
  cityId: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  image?: string;
}

export interface EventFAQ {
  question: string;
  answer: string;
}

export interface EventSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface EventStats {
  views: number;
  favorites: number;
  ticketSales: number;
}

export interface Event extends Timestamps {
  id: string;
  slug: string;
  title: string;
  description: string;
  organizerId: string;
  venueId: string;
  cityId: string;
  categoryId: string;
  coverImage: string;
  gallery: string[];
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  eventType: EventType;
  isOnline: boolean;
  onlineUrl?: string;
  rules: string;
  faqs: EventFAQ[];
  seo: EventSEO;
  stats: EventStats;
}

export interface Ticket extends Timestamps {
  id: string;
  eventId: string;
  name: string;
  type: TicketType;
  price: number;
  currency: Currency;
  quantity: number;
  sold: number;
  capacity: number;
  saleStartDate: Date;
  saleEndDate: Date;
  status: TicketStatus;
}

export interface OrderItem {
  ticketId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order extends Timestamps {
  id: string;
  userId: string;
  eventId: string;
  organizerId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  commission: number;
  total: number;
  status: OrderStatus;
  paymentProvider: string;
  paymentId?: string;
  couponCode?: string;
}

export interface PurchasedTicket extends Timestamps {
  id: string;
  orderId: string;
  ticketId: string;
  ticketCode: string;
  userId: string;
  eventId: string;
  validationToken: string;
  status: PurchasedTicketStatus;
  scannedAt?: Date;
  scannedBy?: string;
}

export interface Coupon extends Timestamps {
  id: string;
  code: string;
  organizerId?: string;
  eventId?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

export interface Review extends Timestamps {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface Notification extends Timestamps {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  data?: Record<string, string>;
}
