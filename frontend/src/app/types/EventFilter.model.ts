/**
 * Interface for event search filters that matches backend EventFiltersDto
 */
export interface EventFilters {
  search?: string;
  types?: string[];
  locations?: string[];
  date?: string;
  sort?: 'newest' | 'popular' | 'upcoming';
  page?: number;
  limit?: number;
  category?: 'music' | 'sports' | 'culture' | 'other';
  attending?: boolean;
  userId?: string;
}
