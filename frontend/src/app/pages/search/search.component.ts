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
import { MatNativeDateModule } from '@angular/material/core';
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
    this.route.queryParamMap.subscribe((params) => {
      this.searchParams = {
        search: params.get('search') || undefined,
        types: params.getAll('types'),
        locations: params.getAll('locations'),
        date: params.get('date') || undefined,
        page: Number(params.get('page')) || 1,
        limit: Number(params.get('limit')) || 20,
        sort:
          (params.get('sort') as 'newest' | 'popular' | 'upcoming') || 'newest',
      };
      this.performSearch();
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

    if (this.searchParams.types?.length) {
      backendFilters.types = this.searchParams.types.map(
        (type) => this.typeToCategory[type] || type,
      );
    }

    if (this.searchParams.locations?.length) {
      backendFilters.locations = this.searchParams.locations;
    }

    if (this.searchParams.date) {
      backendFilters.date =
        this.dateToBackendFormat[this.searchParams.date] ||
        this.searchParams.date;
    }

    return backendFilters;
  }

  performSearch(): void {
    this.loading = true;
    const filters = this.convertFiltersToBackend();

    this.eventsService.getEvents(filters).subscribe({
      next: (response) => {
        // Direkt die Felder aus dem Response-Objekt verwenden
        this.events = response.events || [];
        this.totalEvents = response.total || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        // Bei Fehlern leere Arrays initialisieren
        this.events = [];
        this.totalEvents = 0;
        this.loading = false;
      },
    });
  }

  applyFilter(type: string, value: string): void {
    if (type === 'types') {
      this.searchParams.types = this.searchParams.types || [];
      if (!this.searchParams.types.includes(value)) {
        this.searchParams.types.push(value);
      }
    } else if (type === 'locations') {
      this.searchParams.locations = this.searchParams.locations || [];
      if (!this.searchParams.locations.includes(value)) {
        this.searchParams.locations.push(value);
      }
    } else if (type === 'date') {
      this.searchParams.date = value;
    }

    this.updateUrl();
  }

  removeFilter(type: string, value?: string): void {
    if (type === 'types' && value) {
      this.searchParams.types = this.searchParams.types?.filter(
        (t) => t !== value,
      );
    } else if (type === 'locations' && value) {
      this.searchParams.locations = this.searchParams.locations?.filter(
        (l) => l !== value,
      );
    } else if (type === 'date') {
      this.searchParams.date = undefined;
    }

    this.updateUrl();
  }

  clearAllFilters(): void {
    this.searchParams = {
      page: 1,
      limit: 20,
      sort: 'newest',
    };
    this.updateUrl();
  }

  onSearch(): void {
    this.searchParams.search = this.searchInput.value || undefined;
    this.updateUrl();
  }

  onSpecificDateSelected(event: any): void {
    const date = event.value;
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      this.searchParams.date = formattedDate;
    } else {
      this.searchParams.date = undefined;
    }
    this.updateUrl();
  }

  private updateUrl(): void {
    this.router.navigate(['/search'], {
      queryParams: {
        search: this.searchParams.search,
        types: this.searchParams.types,
        locations: this.searchParams.locations,
        date: this.searchParams.date,
        page: this.searchParams.page,
        limit: this.searchParams.limit,
        sort: this.searchParams.sort,
      },
      queryParamsHandling: 'merge',
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
}
