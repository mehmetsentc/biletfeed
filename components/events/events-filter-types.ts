export type PriceFilter = 'free' | 'paid';
export type DateFilter = 'today' | 'tomorrow' | 'week' | 'weekend' | 'pick';
export type FormatFilter =
  | 'concert'
  | 'festival'
  | 'theatre'
  | 'sports'
  | 'workshop'
  | 'online';

export interface EventsFilters {
  price: PriceFilter[];
  date: DateFilter[];
  categories: string[];
  formats: FormatFilter[];
  customDate: string;
}

export const defaultEventsFilters: EventsFilters = {
  price: [],
  date: [],
  categories: [],
  formats: [],
  customDate: ''
};
