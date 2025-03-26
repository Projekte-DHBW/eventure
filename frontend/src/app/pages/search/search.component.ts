import { Component, OnInit, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { ActivatedRoute, Router } from '@angular/router';
import { EventsService } from '../../services/events.service';
import { ImageUtilsService } from '../../services/image-utils.service';
import {
  Observable,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
} from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import { MatChipListbox, MatChipsModule } from '@angular/material/chips';
import { Event } from '../../types/events';
import { LocationInputComponent } from '../../location-input/location-input.component';
import { MatNativeDateModule } from '@angular/material/core';

interface SearchParams {
  search?: string;
  types?: string[];
  locations?: string[];
  date?: string;
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'newest' | 'popular' | 'upcoming';
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    EventCardComponent,
    MatAutocompleteModule,
    MatChipsModule,
    LocationInputComponent,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);
  protected images = inject(ImageUtilsService);

  events: Event[] = [];
  totalEvents: number = 0;
  searchParams: SearchParams = {
    page: 1,
    limit: 20,
    sort: 'newest',
  };

  private dateToBackendFormat: Record<string, string> = {
    Heute: 'today',
    Morgen: 'tomorrow',
    'Diese Woche': 'this_week',
    'Diesen Monat': 'this_month',
    'Dieses Jahr': 'this_year',
  };

  private typeToCategory: Record<string, string> = {
    Musik: 'music',
    Sport: 'sports',
    Kultur: 'culture',
    Anderes: 'other',
  };

  readonly types = input(['Musik', 'Sport', 'Kultur', 'Anderes']);

  readonly locations = input(['Berlin', 'Hamburg', 'München']);

  readonly dates = input([
    'Heute',
    'Morgen',
    'Diese Woche',
    'Diesen Monat',
    'Dieses Jahr',
  ]);

  showAllLocations = false;
  initialLocationCount = 6;

  searchInput = new FormControl('');
  loading = false;
  filteredLocations: Observable<string[]> | undefined;
  specificDateControl = new FormControl<Date | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      // Correctly parse the URL parameters
      const typesParam = params.getAll('types');
      const locationsParam = params.getAll('locations');

      console.log('URL types:', typesParam);
      console.log('URL locations:', locationsParam);

      this.searchParams = {
        search: params.get('search') || undefined,
        types: typesParam.length > 0 ? typesParam : [],
        locations: locationsParam.length > 0 ? locationsParam : [],
        date: params.get('date') || undefined,
        page: Number(params.get('page')) || 1,
        limit: Number(params.get('limit')) || 20,
        sort:
          (params.get('sort') as 'newest' | 'popular' | 'upcoming') || 'newest',
      };

      console.log('Parsed search params:', this.searchParams);

      if (this.hasSearchParams) {
        this.performSearch();
      } else {
        // Load default events if no search params are present
        this.loadInitialEvents();
      }

      // Update search input field
      if (this.searchParams.search) {
        this.searchInput.setValue(this.searchParams.search);
      }
    });

    this.setupLocationAutocomplete();
  }

  get displayedLocations(): string[] {
    return this.showAllLocations
      ? this.locations()
      : this.locations().slice(0, this.initialLocationCount);
  }

  toggleLocationVisibility(): void {
    this.showAllLocations = !this.showAllLocations;
  }

  get hasSearchParams(): boolean {
    return !!(
      (this.searchParams.search &&
        this.searchParams.search.trim().length > 0) ||
      (this.searchParams.types && this.searchParams.types.length > 0) ||
      (this.searchParams.locations && this.searchParams.locations.length > 0) ||
      this.searchParams.date
    );
  }

  private convertFiltersToBackend(): any {
    const backendFilters: any = {
      page: this.searchParams.page || 1,
      limit: this.searchParams.limit || 20,
    };

    if (this.searchParams.search?.trim()) {
      backendFilters.search = this.searchParams.search.trim();
    }

    if (this.searchParams.sort) {
      backendFilters.sort = this.searchParams.sort;
    }

    // Handle event type filtering correctly
    if (this.searchParams.types?.length) {
      // Map the frontend types to backend categories
      const categories = this.searchParams.types
        .map((type) => this.typeToCategory[type])
        .filter((category) => !!category);

      if (categories.length > 0) {
        if (categories.length === 1) {
          // If only one category, use 'category' parameter
          backendFilters.category = categories[0];
        } else {
          // If multiple categories, use 'types' parameter (what backend expects)
          backendFilters.types = categories;
        }
      }
    }

    if (this.searchParams.locations?.length) {
      backendFilters.locations = this.searchParams.locations;
    }

    if (this.searchParams.date) {
      backendFilters.date =
        this.dateToBackendFormat[this.searchParams.date] ||
        this.searchParams.date;
    }

    console.log('Sending filters to backend:', backendFilters);
    return backendFilters;
  }

  performSearch(): void {
    this.loading = true;
    const filters = this.convertFiltersToBackend();

    console.log('Performing search with filters:', filters);

    this.eventsService.getEvents(filters).subscribe({
      next: (response) => {
        console.log('Search response received:', response);
        this.events = response.events || [];
        this.totalEvents = response.total || 0;
        this.loading = false;

        // Log if no events were returned
        if (!this.events.length) {
          console.log('No events returned from search');
        }
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        this.events = [];
        this.totalEvents = 0;
        this.loading = false;
      },
    });
  }

  applyFilter(type: string, value: string): void {
    let changed = false;

    if (type === 'types') {
      this.searchParams.types = this.searchParams.types || [];
      if (!this.searchParams.types.includes(value)) {
        this.searchParams.types.push(value);
        changed = true;
      }
    } else if (type === 'locations') {
      this.searchParams.locations = this.searchParams.locations || [];
      if (!this.searchParams.locations.includes(value)) {
        this.searchParams.locations.push(value);
        changed = true;
      }
    } else if (type === 'date') {
      if (this.searchParams.date !== value) {
        this.searchParams.date = value;
        changed = true;
      }
    }

    if (changed) {
      console.log('Filter applied:', type, value);
      this.updateUrl();
    }
  }

  removeFilter(type: string, value?: string): void {
    let changed = false;

    if (type === 'types' && value && this.searchParams.types) {
      const index = this.searchParams.types.indexOf(value);
      if (index >= 0) {
        this.searchParams.types.splice(index, 1);
        if (this.searchParams.types.length === 0) {
          delete this.searchParams.types;
        }
        changed = true;
      }
    } else if (type === 'locations' && value && this.searchParams.locations) {
      const index = this.searchParams.locations.indexOf(value);
      if (index >= 0) {
        this.searchParams.locations.splice(index, 1);
        if (this.searchParams.locations.length === 0) {
          delete this.searchParams.locations;
        }
        changed = true;
      }
    } else if (type === 'date') {
      delete this.searchParams.date;
      changed = true;
    }

    if (changed) {
      this.updateUrl();
    }
  }

  clearAllFilters(): void {
    this.searchParams = {
      page: 1,
      limit: 20,
      sort: 'newest',
    };
    this.searchInput.setValue('');
    this.updateUrl();
    // Make sure we load initial events when filters are cleared
    this.loadInitialEvents();
  }

  onSearch(): void {
    this.searchParams.search = this.searchInput.value || undefined;
    this.updateUrl();
  }

  onSpecificDateSelected(event: any): void {
    const date = event.value;
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      this.searchParams.date = formattedDate;
    } else {
      this.searchParams.date = undefined;
    }
    this.updateUrl();
  }

  private updateUrl(): void {
    // Reset to page 1 when filters change
    this.searchParams.page = 1;

    // Create a clean params object with only defined values
    const queryParams: any = {};

    if (this.searchParams.search) queryParams.search = this.searchParams.search;

    if (this.searchParams.types && this.searchParams.types.length > 0) {
      queryParams.types = this.searchParams.types;
    }

    if (this.searchParams.locations && this.searchParams.locations.length > 0) {
      queryParams.locations = this.searchParams.locations;
    }

    if (this.searchParams.date) queryParams.date = this.searchParams.date;
    if (this.searchParams.sort) queryParams.sort = this.searchParams.sort;
    if (this.searchParams.limit) queryParams.limit = this.searchParams.limit;

    console.log('Updating URL with params:', queryParams);

    this.router
      .navigate(['/search'], {
        queryParams,
        replaceUrl: true,
      })
      .then(() => {
        // Always perform a search after URL is updated
        if (Object.keys(queryParams).length > 0) {
          this.performSearch();
        } else {
          // If no filters at all, load initial/default events
          this.loadInitialEvents();
        }
      });
  }

  private setupLocationAutocomplete(): void {
    this.filteredLocations = this.searchInput.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((value) => {
        const filterValue = value!.toLowerCase();
        const filtered = this.locations().filter((location) =>
          location.toLowerCase().includes(filterValue),
        );
        return of(filtered);
      }),
    );
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onLocationSelected(location: string): void {
    this.applyFilter('locations', location);
  }

  // Update the onLocationAdded method
  onLocationAdded(location: string): void {
    if (!location) return;

    console.log('Location added:', location);
    this.applyFilter('locations', location);
  }

  private loadInitialEvents(): void {
    // Always load some events on first visit, even without filters
    if (!this.events.length && !this.hasSearchParams) {
      console.log('Loading initial events');
      const initialFilters = {
        page: 1,
        limit: 20,
        sort: 'newest',
      };

      this.loading = true;
      this.eventsService.getEvents(initialFilters).subscribe({
        next: (response) => {
          console.log('Initial events loaded:', response);
          this.events = response.events || [];
          this.totalEvents = response.total || 0;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading initial events:', err);
          this.loading = false;
        },
      });
    }
  }
}
