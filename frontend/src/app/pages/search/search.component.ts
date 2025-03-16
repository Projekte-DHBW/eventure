import { Component, OnInit, Input } from '@angular/core';

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
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
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

  // Map frontend filter values to backend values
  private dateToBackendFormat: Record<string, string> = {
    Heute: 'today',
    Morgen: 'tomorrow',
    'Diese Woche': 'this_week',
    'Diesen Monat': 'this_month',
    'Dieses Jahr': 'this_year',
  };

  // Map frontend types to backend categories
  private typeToCategory: Record<string, string> = {
    Konzert: 'music',
    Festival: 'music',
    Sport: 'sports',
    Theater: 'culture',
    Ausstellung: 'culture',
    Workshop: 'other',
    Konferenz: 'other',
  };

  @Input() types = [
    'Konzert',
    'Festival',
    'Sport',
    'Theater',
    'Ausstellung',
    'Workshop',
    'Konferenz',
  ];

  @Input() locations = [
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
  ];

  @Input() dates = [
    'Heute',
    'Morgen',
    'Diese Woche',
    'Diesen Monat',
    'Dieses Jahr',
  ];

  // Properties for location filter
  showAllLocations = false;
  initialLocationCount = 6;

  searchInput = new FormControl('');
  loading = false;
  filteredLocations: Observable<string[]> | undefined;

  // Add date picker control
  specificDateControl = new FormControl<Date | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
  ) {}

  ngOnInit(): void {
    // Lade initial die neuesten Events
    this.loadLatestEvents();

    // Überwache URL-Parameter
    this.route.queryParamMap.subscribe((params) => {
      console.log('Query params changed:', params);

      // Zurücksetzen der Parameter mit Beibehaltung der Standardwerte
      this.searchParams = {
        page: 1,
        limit: 20,
        sort: 'newest',
      };

      // URL-Parameter auslesen
      if (params.has('search')) {
        const searchValue = params.get('search');
        if (searchValue && searchValue.trim().length > 0) {
          this.searchParams.search = searchValue;
          this.searchInput.setValue(searchValue, { emitEvent: false });
        }
      } else {
        this.searchInput.setValue('', { emitEvent: false });
      }

      // Arrays korrekt extrahieren
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

      console.log('Updated searchParams:', this.searchParams);

      // Wenn Filter aktiv sind, führe Suche durch
      if (this.hasSearchParams) {
        console.log('Has search params, performing search');
        this.performSearch();
      } else {
        console.log('No search params, loading latest events');
        this.loadLatestEvents();
      }
    });

    // Einrichtung der Ortsautovervollständigung
    this.setupLocationAutocomplete();
  }

  // Lade die neuesten Events
  loadLatestEvents(): void {
    this.loading = true;
    console.log('Loading latest events');

    this.eventsService
      .getLatestEvents(this.searchParams.limit || 20)
      .subscribe({
        next: (events) => {
          console.log('Latest events loaded:', events);
          if (Array.isArray(events)) {
            this.events = events;
            this.totalEvents = events.length;
          } else {
            console.warn('API did not return an array for latest events');
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
        complete: () => {
          // Sicherstellen, dass loading auf false gesetzt wird
          this.loading = false;
        },
      });
  }

  // Angezeigte Standorte
  get displayedLocations(): string[] {
    return this.showAllLocations
      ? this.locations
      : this.locations.slice(0, this.initialLocationCount);
  }

  // Umschalten der Standortanzeige
  toggleLocationVisibility(): void {
    this.showAllLocations = !this.showAllLocations;
  }

  // Prüfen, ob Suchparameter aktiv sind
  get hasSearchParams(): boolean {
    return !!(
      (this.searchParams.search &&
        this.searchParams.search.trim().length > 0) ||
      (this.searchParams.types && this.searchParams.types.length > 0) ||
      (this.searchParams.locations && this.searchParams.locations.length > 0) ||
      this.searchParams.date
    );
  }

  // Frontend-Filter in Backend-Format konvertieren
  private convertFiltersToBackend(): any {
    // Ausgangsbasis
    const backendFilters: any = {};

    // Immer Pagination angeben
    backendFilters.page = this.searchParams.page || 1;
    backendFilters.limit = this.searchParams.limit || 20;

    // Suche hinzufügen
    if (this.searchParams.search && this.searchParams.search.trim()) {
      backendFilters.search = this.searchParams.search.trim().toLowerCase();
    }

    // Sortierung
    if (this.searchParams.sort) {
      backendFilters.sort = this.searchParams.sort;
    }

    // Event-Typen verarbeiten
    if (this.searchParams.types && this.searchParams.types.length > 0) {
      // Kategorien ermitteln und zählen
      const categories = this.searchParams.types.map(
        (type) => this.typeToCategory[type],
      );
      const categoryCounts: Record<string, number> = {};

      categories.forEach((category) => {
        if (category) {
          // Prüfen ob category definiert ist
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      // Wenn nur eine Kategorie vorkommt, setze category-Parameter
      const uniqueCategories = Object.keys(categoryCounts);
      if (uniqueCategories.length === 1) {
        backendFilters.category = uniqueCategories[0];
      } else {
        // Sonst geben wir die Typen direkt an den Backend-Filter weiter
        backendFilters.types = this.searchParams.types;
      }
    }

    // Standorte - KORRIGIERTE IMPLEMENTIERUNG
    if (this.searchParams.locations && this.searchParams.locations.length > 0) {
      // Verwende kein Array, sondern einen einzelnen String mit kommagetrennten Werten
      backendFilters.locations = this.searchParams.locations.join(',');
    }

    // Datum - ERWEITERTE IMPLEMENTIERUNG
    if (this.searchParams.date) {
      // Check if the date is a predefined value or a specific date string
      if (
        Object.keys(this.dateToBackendFormat).includes(this.searchParams.date)
      ) {
        // It's a predefined value
        backendFilters.date = this.dateToBackendFormat[this.searchParams.date];
      } else if (this.searchParams.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // It's already in YYYY-MM-DD format
        backendFilters.date = this.searchParams.date;
      }

      console.log(
        `Converted date filter: "${this.searchParams.date}" -> "${backendFilters.date}"`,
      );
    }

    console.log('Converted backend filters:', backendFilters);
    return backendFilters;
  }

  // Suche ausführen
  performSearch(): void {
    this.loading = true;
    console.log('Performing search with params:', this.searchParams);

    // Frontend-Filter in Backend-Format konvertieren
    const backendFilters = this.convertFiltersToBackend();

    this.eventsService.getEvents(backendFilters).subscribe({
      next: ([events, totalCount]) => {
        console.log('Raw API response values:', { events, totalCount });

        // Null-Check und Schutz vor undefiniertem Array
        if (!events || !Array.isArray(events)) {
          console.warn('API returned undefined or invalid events array');
          this.events = [];
          this.totalEvents = 0;
        } else {
          console.log(
            `Search results: ${events.length} events, total: ${totalCount}`,
          );
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
      complete: () => {
        // Sicherstellen, dass loading auf false gesetzt wird
        this.loading = false;
      },
    });
  }

  // Filter anwenden
  applyFilter(type: string, value: string): void {
    console.log(`Applying filter: ${type} = ${value}`);

    switch (type) {
      case 'types':
        // Initialize array if needed
        if (!this.searchParams.types) {
          this.searchParams.types = [];
        }

        // Toggle filter
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
        // Initialize array if needed
        if (!this.searchParams.locations) {
          this.searchParams.locations = [];
        }

        // Toggle filter
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
        // Toggle date filter
        if (this.searchParams.date === value) {
          console.log('Removing date filter');
          this.searchParams.date = undefined;
        } else {
          console.log(`Setting date filter to: ${value}`);
          this.searchParams.date = value;

          // Direkt testen (optional, zu Debug-Zwecken)
          this.testDateFilter(value);
        }
        break;
    }

    // Zurück zur ersten Seite bei Filteränderung
    this.searchParams.page = 1;

    // URL aktualisieren
    this.updateUrl();
  }

  // Apply specific date from date picker
  applySpecificDate(event: any): void {
    const date = this.specificDateControl.value;
    if (date) {
      // Convert to YYYY-MM-DD format
      const dateString = date.toISOString().split('T')[0];
      console.log(`Applying specific date: ${dateString}`);

      // Set as date filter
      this.searchParams.date = dateString;

      // Update UI
      this.searchParams.page = 1;
      this.updateUrl();
    }
  }

  // Filter entfernen
  removeFilter(type: string, value?: string): void {
    console.log(`Removing filter: ${type}${value ? ' = ' + value : ''}`);

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

    // URL aktualisieren
    this.updateUrl();
  }

  // Alle Filter zurücksetzen
  clearAllFilters(): void {
    console.log('Clearing all filters');

    // Zurücksetzen auf Standardwerte
    this.searchParams = {
      page: 1,
      limit: 20,
      sort: 'newest',
    };

    // Suchfeld leeren
    this.searchInput.setValue('', { emitEvent: false });

    // Komplett neue Navigation ohne Parameter
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {}, // Leere Query-Parameter
        replaceUrl: true, // Ersetze den aktuellen History-Eintrag
        queryParamsHandling: '', // Wichtig: Überschreibt alle vorhandenen Parameter
      })
      .then(() => {
        // Nach erfolgreichem Zurücksetzen die neuesten Events laden
        this.loadLatestEvents();
      });
  }

  // Suche bei Klick auf Suchbutton
  onSearch(): void {
    const searchValue = this.searchInput.value?.trim() || '';
    console.log(`Search button clicked, value: "${searchValue}"`);

    // Setze Suchbegriff
    if (searchValue.length > 0) {
      this.searchParams.search = searchValue;
    } else {
      this.searchParams.search = undefined;
    }

    // Zurück zur ersten Seite
    this.searchParams.page = 1;

    // URL aktualisieren
    this.updateUrl();
  }

  // URL mit aktuellen Suchparametern aktualisieren
  private updateUrl(): void {
    // Query-Parameter mit definierten Werten erstellen
    const queryParams: any = {};

    // Nur Parameter hinzufügen, die auch Werte haben
    if (this.searchParams.search) {
      queryParams.search = this.searchParams.search;
    }

    if (this.searchParams.types && this.searchParams.types.length > 0) {
      queryParams.types = this.searchParams.types;
    }

    if (this.searchParams.locations && this.searchParams.locations.length > 0) {
      queryParams.locations = this.searchParams.locations;
    }

    if (this.searchParams.date) {
      console.log(`Adding date param to URL: ${this.searchParams.date}`);
      queryParams.date = this.searchParams.date;
    }

    if (this.searchParams.page && this.searchParams.page !== 1) {
      queryParams.page = this.searchParams.page;
    }

    if (this.searchParams.limit && this.searchParams.limit !== 20) {
      queryParams.limit = this.searchParams.limit;
    }

    if (this.searchParams.sort && this.searchParams.sort !== 'newest') {
      queryParams.sort = this.searchParams.sort;
    }

    console.log('Updating URL with query params:', queryParams);

    // Mit neuen Query-Parametern navigieren und alle vorhandenen überschreiben
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true, // Ersetze den aktuellen History-Eintrag
      queryParamsHandling: '', // Wichtig: Überschreibt alle vorhandenen Parameter
    });
  }

  // Einrichten der Standort-Autovervollständigung
  private setupLocationAutocomplete(): void {
    this.filteredLocations = this.searchInput.valueChanges.pipe(
      debounceTime(300),
      switchMap((value) => {
        if (!value || typeof value !== 'string' || value.length < 2) {
          return of(this.locations);
        }

        return this.eventsService.searchCities(value).pipe(
          map((response) => response.cities),
          catchError(() => {
            console.error('Fehler beim Abrufen der Städte');
            return of(this.locations);
          }),
        );
      }),
    );
  }

  // Hilfsmethode: Ersten Buchstaben großschreiben
  capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Hilfsmethode: Monatsabkürzung erhalten
  getMonthAbbreviation(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('de-DE', { month: 'short' });
    } catch (e) {
      return '';
    }
  }

  // Hilfsmethode: Tag des Monats erhalten
  getDayFromDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.getDate().toString();
    } catch (e) {
      return '';
    }
  }

  // Zu Event-Details navigieren
  goToEventDetails(eventId: string): void {
    if (!eventId) return;
    this.router.navigate(['/events', eventId]);
  }

  // Debug-Funktion zum Testen des Zeitraumfilters
  testDateFilter(dateValue: string): void {
    console.log('TESTING DATE FILTER');
    console.log('------------------');

    // Setze Test-Datum
    this.searchParams.date = dateValue;

    // Konvertiere zu Backend-Format
    const backendFilters = this.convertFiltersToBackend();

    // Debug-Logs
    console.log(`Frontend date value: "${dateValue}"`);
    console.log(`Converted to backend: "${backendFilters.date}"`);

    // Test-API-Anfrage ohne Navigation
    this.loading = true;
    this.eventsService.getEvents(backendFilters).subscribe({
      next: ([events, count]) => {
        console.log(
          `Test request returned ${events.length} events out of ${count} total`,
        );
        console.log('Sample events:', events.slice(0, 3));
        this.loading = false;
      },
      error: (err) => {
        console.error('Test request failed:', err);
        this.loading = false;
      },
    });
  }
}
