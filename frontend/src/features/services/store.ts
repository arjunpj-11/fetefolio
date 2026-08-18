import type { ServiceCategory } from '@programme/contracts';
import { create } from 'zustand';

export type SortOption = 'newest' | 'priceAsc' | 'priceDesc' | 'titleAsc' | 'ratingDesc';
export interface IFilters {
  category?: ServiceCategory;
  city: string;
  minPrice: string;
  maxPrice: string;
  date: string;
  startDate: string;
  endDate: string;
  minRating: string;
  search: string;
  page: number;
  limit: number;
  sort: SortOption;
}
interface IFilterState extends IFilters {
  setFilter: <K extends keyof IFilters>(key: K, value: IFilters[K]) => void;
  resetFilters: () => void;
}
const defaults: IFilters = {
  city: '',
  minPrice: '',
  maxPrice: '',
  date: '',
  startDate: '',
  endDate: '',
  minRating: '',
  search: '',
  page: 1,
  limit: 9,
  sort: 'newest',
};
export const useFilterStore = create<IFilterState>((set) => ({
  ...defaults,
  setFilter: (key, value) => set({ [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }),
  resetFilters: () => set(defaults),
}));
