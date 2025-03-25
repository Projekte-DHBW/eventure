import { Component, OnInit, input, inject } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { EventsService } from '../../services/events.service';
import { Event } from '../../types/events';
import { Observable, debounceTime, switchMap, of, catchError, map } from 'rxjs';
import { ImageUtilsService } from '../../services/image-utils.service';
import { EventCardComponent } from '../../components/event-card/event-card.component';

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
  searchParams: {
    search?: string;
    types?: string[];
    locations?: string[];
    date?: string;
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'newest' | 'popular' | 'upcoming';
  } = {
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
    Konzert: 'music',
    Festival: 'music',
    Sport: 'sports',
    Theater: 'culture',
    Ausstellung: 'culture',
    Workshop: 'other',
    Konferenz: 'other',
  };

  readonly types = input([
    'Konzert',
    'Festival',
    'Sport',
    'Theater',
    'Ausstellung',
    'Workshop',
    'Konferenz',
  ]);

  readonly locations = input([
    'Berlin',
    'Hamburg',
    'München',
    'Köln',
    'Frankfurt',
    'Stuttgart',
    'Dresden',
    'Leipzig',
    'Nürnberg',
    'Hannover',
    'Bremen',
    'Essen',
    'Dortmund',
    'Bonn',
    'Mannheim',
    'Freiburg',
    'Heidelberg',
    'Augsburg',
  ]);

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
    this.loadLatestEvents();

    this.route.queryParamMap.subscribe((params) => {
      console.log('Query params changed:', params);

      this.searchParams = {
        page: 1,
        limit: 20,
        sort: 'newest',
      };

      if (params.has('search')) {
        const searchValue = params.get('search');
        if (searchValue && searchValue.trim().length > 0) {
          this.searchParams.search = searchValue;
          this.searchInput.setValue(searchValue, { emitEvent: false });
        }
      } else {
        this.searchInput.setValue('', { emitEvent: false });
      }

      const types = params.getAll('types');
      if (types && types.length > 0) {
        this.searchParams.types = types;
      }

      const locations = params.getAll('locations');
      if (locations && locations.length > 0) {
        this.searchParams.locations = locations;
      }

      if (params.has('date')) {
        this.searchParams.date = params.get('date') || undefined;
      }

      if (params.has('page')) {
        const page = parseInt(params.get('page') || '1', 10);
        if (!isNaN(page) && page > 0) {
          this.searchParams.page = page;
        }
      }

      if (params.has('limit')) {
        const limit = parseInt(params.get('limit') || '20', 10);
        if (!isNaN(limit) && limit > 0) {
          this.searchParams.limit = limit;
        }
      }

      if (params.has('sort')) {
        const sort = params.get('sort');
        if (sort === 'newest' || sort === 'popular' || sort === 'upcoming') {
          this.searchParams.sort = sort;
        }
      }

      if (this.hasSearchParams) {
        this.performSearch();
      } else {
        this.loadLatestEvents();
      }
    });

    this.setupLocationAutocomplete();
  }

  loadLatestEvents(): void {
    this.loading = true;

    this.eventsService
      .getLatestEvents(this.searchParams.limit || 20)
      .subscribe({
        next: (events) => {
          if (Array.isArray(events)) {
            this.events = events;
            this.totalEvents = events.length;
          } else {
            this.events = [];
            this.totalEvents = 0;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Fehler beim Laden der Events:', err);
          this.events = [];
          this.totalEvents = 0;
          this.loading = false;
        },
      });
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
      backendFilters.search = this.searchParams.search.trim().toLowerCase();
    }

    if (this.searchParams.sort) {
      backendFilters.sort = this.searchParams.sort;
    }

    if (this.searchParams.types?.length) {
      const categories = this.searchParams.types.map(
        (type) => this.typeToCategory[type],
      );
      const categoryCounts: Record<string, number> = {};

      categories.forEach((category) => {
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      const uniqueCategories = Object.keys(categoryCounts);
      if (uniqueCategories.length === 1) {
        backendFilters.category = uniqueCategories[0];
      } else {
        backendFilters.types = this.searchParams.types;
      }
    }

    if (this.searchParams.locations?.length) {
      backendFilters.locations = this.searchParams.locations.join(',');
    }

    if (this.searchParams.date) {
      if (
        Object.keys(this.dateToBackendFormat).includes(this.searchParams.date)
      ) {
        backendFilters.date = this.dateToBackendFormat[this.searchParams.date];
      } else if (this.searchParams.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        backendFilters.date = this.searchParams.date;
      }
    }

    return backendFilters;
  }

  performSearch(): void {
    this.loading = true;
    const backendFilters = this.convertFiltersToBackend();

    this.eventsService.getEvents(backendFilters).subscribe({
      next: ([events, totalCount]) => {
        if (!events || !Array.isArray(events)) {
          this.events = [];
          this.totalEvents = 0;
        } else {
          this.events = events;
          this.totalEvents = totalCount || events.length;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler bei der Suche:', err);
        this.events = [];
        this.totalEvents = 0;
        this.loading = false;
      },
    });
  }

  applyFilter(type: string, value: string): void {
    switch (type) {
      case 'types':
        if (!this.searchParams.types) {
          this.searchParams.types = [];
        }
        if (this.searchParams.types.includes(value)) {
          this.searchParams.types = this.searchParams.types.filter(
            (t) => t !== value,
          );
          if (this.searchParams.types.length === 0) {
            this.searchParams.types = undefined;
          }
        } else {
          this.searchParams.types.push(value);
        }
        break;

      case 'locations':
        if (!this.searchParams.locations) {
          this.searchParams.locations = [];
        }
        if (this.searchParams.locations.includes(value)) {
          this.searchParams.locations = this.searchParams.locations.filter(
            (l) => l !== value,
          );
          if (this.searchParams.locations.length === 0) {
            this.searchParams.locations = undefined;
          }
        } else {
          this.searchParams.locations.push(value);
        }
        break;

      case 'date':
        this.searchParams.date =
          this.searchParams.date === value ? undefined : value;
        break;
    }

    this.searchParams.page = 1;
    this.updateUrl();
  }

  removeFilter(type: string, value?: string): void {
    switch (type) {
      case 'types':
        if (value && this.searchParams.types) {
          this.searchParams.types = this.searchParams.types.filter(
            (t) => t !== value,
          );
          if (this.searchParams.types.length === 0) {
            this.searchParams.types = undefined;
          }
        }
        break;

      case 'locations':
        if (value && this.searchParams.locations) {
          this.searchParams.locations = this.searchParams.locations.filter(
            (l) => l !== value,
          );
          if (this.searchParams.locations.length === 0) {
            this.searchParams.locations = undefined;
          }
        }
        break;

      case 'date':
        this.searchParams.date = undefined;
        break;
    }

    this.updateUrl();
  }

  clearAllFilters(): void {
    this.searchParams = {
      page: 1,
      limit: 20,
      sort: 'newest',
    };

    this.searchInput.setValue('', { emitEvent: false });

    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
        queryParamsHandling: '',
      })
      .then(() => {
        this.loadLatestEvents();
      });
  }

  onSearch(): void {
    const searchValue = this.searchInput.value?.trim() || '';

    if (searchValue.length > 0) {
      this.searchParams.search = searchValue;
    } else {
      this.searchParams.search = undefined;
    }

    this.searchParams.page = 1;
    this.updateUrl();
  }

  private updateUrl(): void {
    const queryParams: any = {};

    if (this.searchParams.search) {
      queryParams.search = this.searchParams.search;
    }

    if (this.searchParams.types?.length) {
      queryParams.types = this.searchParams.types;
    }

    if (this.searchParams.locations?.length) {
      queryParams.locations = this.searchParams.locations;
    }

    if (this.searchParams.date) {
      queryParams.date = this.searchParams.date;
    }

    if (this.searchParams.page !== 1) {
      queryParams.page = this.searchParams.page;
    }

    if (this.searchParams.limit !== 20) {
      queryParams.limit = this.searchParams.limit;
    }

    if (this.searchParams.sort !== 'newest') {
      queryParams.sort = this.searchParams.sort;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true,
      queryParamsHandling: '',
    });
  }

  private setupLocationAutocomplete(): void {
    this.filteredLocations = this.searchInput.valueChanges.pipe(
      debounceTime(300),
      switchMap((value) => {
        if (!value || typeof value !== 'string' || value.length < 2) {
          return of(this.locations());
        }

        return this.eventsService.searchCities(value).pipe(
          map((response) => response.cities),
          catchError(() => {
            console.error('Fehler beim Abrufen der Städte');
            return of(this.locations());
          }),
        );
      }),
    );
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
