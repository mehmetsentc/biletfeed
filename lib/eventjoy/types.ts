export type GuestStatus = 'pending' | 'confirmed' | 'declined';

export interface EventJoyGuest {
  id: string;
  name: string;
  email: string;
  status: GuestStatus;
  plusOne?: number;
  isHost?: boolean;
  phone?: string;
}

export interface EventJoyTask {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
}

export interface EventJoyBudgetItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  paid: number;
  status: 'paid' | 'pending';
}

export interface EventJoyContact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
}

export interface EventJoyTemplate {
  id: string;
  name: string;
  image: string;
  coverColor: string;
}

export interface EventJoyEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverColor: string;
  coverImage?: string;
  guestCount: number;
  confirmedCount: number;
  budget: number;
  spent: number;
  guests: EventJoyGuest[];
  tasks: EventJoyTask[];
  budgetItems: EventJoyBudgetItem[];
}

export interface EventJoyProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
}

export interface EventJoyStore {
  profile: EventJoyProfile;
  events: EventJoyEvent[];
  contacts: EventJoyContact[];
  version?: number;
}

export interface CreateEventJoyInput {
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverImage?: string;
  coverColor: string;
}
