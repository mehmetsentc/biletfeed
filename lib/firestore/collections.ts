export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZERS: 'organizers',
  EVENTS: 'events',
  VENUES: 'venues',
  CATEGORIES: 'categories',
  CITIES: 'cities',
  TICKETS: 'tickets',
  ORDERS: 'orders',
  TRANSACTIONS: 'transactions',
  COUPONS: 'coupons',
  FOLLOWERS: 'followers',
  FAVORITES: 'favorites',
  NOTIFICATIONS: 'notifications',
  REVIEWS: 'reviews',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  PURCHASED_TICKETS: 'purchasedTickets'
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
