import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

interface Event {
  id: number;
  title: string;
  type: string;
  location: string;
  description: string;
  day: string;
  date: string;
  tags: string[];
  image: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  searchParams: {
    [key: string]: string | string[] | undefined;
    types?: string[];
    locations?: string[];
    date?: string;
    startDate?: string;
    endDate?: string;
  } = {};

  @Input() type = [
    'Konzert',
    'Festival',
    'Theater',
    'Sport',
    'Kunst',
    'Kultur',
  ];
  
  @Input() location = [
    'Berlin', 'München', 'Heidenheim', 'Köln', 'Hamburg', 'Frankfurt', 
    'Stuttgart', 'Düsseldorf', 'Dresden', 'Leipzig', 'Nürnberg',
    'Hannover', 'Bremen', 'Essen', 'Dortmund', 'Bonn', 'Mannheim',
    'Freiburg', 'Heidelberg', 'Augsburg'
  ];
  
  @Input() date = [
    'Heute',
    'Morgen',
    'Diese Woche',
    'Diesen Monat',
    'Dieses Jahr',
  ];

  // New properties for location filter
  showAllLocations = false;
  initialLocationCount = 6;

  searchInput = new FormControl('');
  loading = true;
  events: any[] = [];
  hasSearchParams = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  // New getter for displayed locations
  get displayedLocations(): string[] {
    return this.showAllLocations ? this.location : this.location.slice(0, this.initialLocationCount);
  }

  // New method to toggle location visibility
  toggleLocationVisibility() {
    this.showAllLocations = !this.showAllLocations;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      let types: string[] = [];
      let locations: string[] = [];

      if (params['types']) {
        types = this.parseArrayParam(params['types']);

        types = [...new Set(types)];
      } else if (params['type']) {
        types = [params['type']];
      }

      if (params['locations']) {
        locations = this.parseArrayParam(params['locations']);

        locations = [...new Set(locations)];
      } else if (params['location']) {
        locations = [params['location']];
      }

      this.searchParams = {
        types: types,
        locations: locations,
        date: params['date'] || '',
        startDate: params['startDate'] || '',
        endDate: params['endDate'] || '',
      };

      if (params['date'] && (!params['startDate'] || !params['endDate'])) {
        this.setDateRangeFromLabel(params['date']);
      }

      this.hasSearchParams = !!(
        this.searchParams.types?.length ||
        this.searchParams.locations?.length ||
        this.searchParams.date ||
        this.searchParams.startDate ||
        this.searchParams.endDate
      );

      if (params['q']) {
        this.searchInput.setValue(params['q']);
      }

      console.log('Search parameters:', this.searchParams);

      this.loading = true;

      setTimeout(() => {
        this.loading = false;
        this.events = this.generateMockEvents(this.searchParams, params['q']);
      }, 1000);
    });
  }

  parseArrayParam(param: string | string[]): string[] {
    if (Array.isArray(param)) {
      return param;
    }

    return param
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  setDateRangeFromLabel(dateLabel: string): void {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateLabel.toLowerCase()) {
      case 'heute':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'morgen':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        startDate = tomorrow;
        endDate = tomorrow;
        break;
      case 'diese woche':
        startDate = this.getStartOfWeek(today);
        endDate = this.getEndOfWeek(today);
        break;
      case 'diesen monat':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'dieses jahr':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
    }

    if (startDate && endDate) {
      this.searchParams.startDate = this.formatDate(startDate);
      this.searchParams.endDate = this.formatDate(endDate);
    }
  }

  applyFilter(filterType: 'types' | 'locations' | 'date', value: string): void {
    const queryParams = { ...this.route.snapshot.queryParams };

    if (filterType === 'types' || filterType === 'locations') {
      let currentValues = queryParams[filterType]
        ? queryParams[filterType].split(',')
        : [];

      if (currentValues.includes(value)) {
        currentValues = currentValues.filter((v: string) => v !== value);
      } else {
        currentValues.push(value);
      }

      if (currentValues.length > 0) {
        queryParams[filterType] = currentValues.join(',');
      } else {
        delete queryParams[filterType];
      }
    } else if (filterType === 'date') {
      if (queryParams['date'] === value) {
        delete queryParams['date'];
        delete queryParams['startDate'];
        delete queryParams['endDate'];
      } else {
        queryParams['date'] = value;

        const today = new Date();

        switch (value.toLowerCase()) {
          case 'heute':
            queryParams['startDate'] = this.formatDate(today);
            queryParams['endDate'] = this.formatDate(today);
            break;
          case 'morgen':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            queryParams['startDate'] = this.formatDate(tomorrow);
            queryParams['endDate'] = this.formatDate(tomorrow);
            break;
          case 'diese woche':
            queryParams['startDate'] = this.formatDate(
              this.getStartOfWeek(today),
            );
            queryParams['endDate'] = this.formatDate(this.getEndOfWeek(today));
            break;
          case 'diesen monat':
            queryParams['startDate'] = this.formatDate(
              new Date(today.getFullYear(), today.getMonth(), 1),
            );
            queryParams['endDate'] = this.formatDate(
              new Date(today.getFullYear(), today.getMonth() + 1, 0),
            );
            break;
          case 'dieses jahr':
            queryParams['startDate'] = this.formatDate(
              new Date(today.getFullYear(), 0, 1),
            );
            queryParams['endDate'] = this.formatDate(
              new Date(today.getFullYear(), 11, 31),
            );
            break;
        }
      }
    }

    this.router.navigate(['/search'], {
      queryParams: queryParams,
    });
  }

  removeFilter(
    filterType: 'types' | 'locations' | 'date',
    value?: string,
  ): void {
    const queryParams = { ...this.route.snapshot.queryParams };

    if ((filterType === 'types' || filterType === 'locations') && value) {
      let currentValues = queryParams[filterType]
        ? queryParams[filterType].split(',')
        : [];

      currentValues = currentValues.filter((v: string) => v !== value);

      if (currentValues.length > 0) {
        queryParams[filterType] = currentValues.join(',');
      } else {
        delete queryParams[filterType];
      }
    } else if (filterType === 'date') {
      delete queryParams['date'];
      delete queryParams['startDate'];
      delete queryParams['endDate'];
    } else {
      delete queryParams[filterType];
    }

    this.router.navigate(['/search'], {
      queryParams: queryParams,
    });
  }

  clearAllFilters(): void {
    const searchTerm = this.searchInput.value?.trim();
    const queryParams: any = {};

    if (searchTerm) {
      queryParams.q = searchTerm;
    }

    this.router.navigate(['/search'], {
      queryParams: queryParams,
    });
  }

  onSearch(): void {
    const searchTerm = this.searchInput.value?.trim();
    const queryParams: { [key: string]: any } = {
      ...this.route.snapshot.queryParams,
    };

    if (searchTerm) {
      queryParams['q'] = searchTerm;
    } else {
      delete queryParams['q'];
    }

    this.router.navigate(['/search'], {
      queryParams: queryParams,
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStartOfWeek(date: Date): Date {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(new Date(date));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return endOfWeek;
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    const words = str.split(' ');
    return words
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  getMonthAbbreviation(isoDate: string): string {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    const monthNames = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    return monthNames[date.getMonth()];
  }

  getDayFromDate(isoDate: string): string {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    return date.getDate().toString();
  }

  generateMockEvents(params: any, query?: string): Event[] {
    let mockEvents = [
      {
        id: 1,
        title: 'Sommerfestival Berlin',
        type: 'Festival',
        location: 'Berlin',
        description:
          'Ein fantastisches Sommerfestival mit Live-Musik und Unterhaltung für die ganze Familie.',
        day: '15',
        date: '2025-08-15', // ISO format date
        tags: ['Musik', 'Outdoor', 'Familie'],
        image:
          'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?q=80&w=2070',
      },
      {
        id: 2,
        title: 'Klassisches Konzert',
        type: 'Konzert',
        location: 'München',
        description:
          'Ein Abend mit den schönsten klassischen Kompositionen in der Münchner Philharmonie.',
        day: '22',
        date: '2025-07-22', // ISO format date
        tags: ['Klassik', 'Orchester'],
        image:
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974',
      },
      {
        id: 3,
        title: 'Rock am Ring',
        type: 'Konzert',
        location: 'Köln',
        description:
          'Das legendäre Rock-Festival mit den besten Bands aus aller Welt.',
        day: '05',
        date: '2025-09-05', // ISO format date
        tags: ['Rock', 'Live', 'Festival'],
        image:
          'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070',
      },
      {
        id: 4,
        title: 'Theateraufführung "Der Besuch"',
        type: 'Theater',
        location: 'Berlin',
        description:
          'Eine bewegende Inszenierung des Klassikers auf der Bühne des Berliner Theaters.',
        day: '10',
        date: '2025-08-10', // ISO format date
        tags: ['Drama', 'Klassiker'],
        image:
          'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=2071',
      },
      {
        id: 5,
        title: 'Kunstausstellung Modern Art',
        type: 'Kunst',
        location: 'München',
        description:
          'Zeitgenössische Kunst von aufstrebenden Künstlern aus ganz Europa.',
        day: '18',
        date: '2025-03-12', // ISO format date
        tags: ['Modern', 'Galerie'],
        image:
          'https://images.unsplash.com/photo-1531913764164-f85c52beb936?q=80&w=1974',
      },
      {
        id: 6,
        title: 'Fußball Bundesliga',
        type: 'Sport',
        location: 'Heidenheim',
        description: 'Spannendes Bundesligaspiel in der Voith-Arena.',
        day: '26',
        date: '2025-03-26', // ISO format date
        tags: ['Fußball', 'Bundesliga'],
        image:
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2024',
      },
      {
        id: 7,
        title: 'Jazz Nacht',
        type: 'Konzert',
        location: 'Berlin',
        description:
          'Eine Nacht voller Swing und Jazz mit internationalen Künstlern.',
        day: '03',
        date: '2025-09-03', // ISO format date
        tags: ['Jazz', 'Nachtleben'],
        image:
          'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2071',
      },
      {
        id: 8,
        title: 'Kulturfestival',
        type: 'Kultur',
        location: 'Köln',
        description:
          'Ein Wochenende voller kultureller Highlights aus aller Welt.',
        day: '12',
        date: '2025-08-12', // ISO format date
        tags: ['International', 'Kulinarik'],
        image:
          'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=2075',
      },
    ];

    // Filter by types array
    if (params.types && params.types.length > 0) {
      mockEvents = mockEvents.filter((event) =>
        params.types.some(
          (type: string) => event.type.toLowerCase() === type.toLowerCase(),
        ),
      );
    }

    // Filter by locations array
    if (params.locations && params.locations.length > 0) {
      mockEvents = mockEvents.filter((event) =>
        params.locations.some(
          (location: string) =>
            event.location.toLowerCase() === location.toLowerCase(),
        ),
      );
    }

    // Filter by date range
    if (params.startDate && params.endDate) {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      // Set the end date to the end of the day for inclusive comparison
      endDate.setHours(23, 59, 59, 999);

      mockEvents = mockEvents.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }

    // Search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      mockEvents = mockEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(lowercaseQuery) ||
          event.description.toLowerCase().includes(lowercaseQuery) ||
          event.tags.some((tag: string) =>
            tag.toLowerCase().includes(lowercaseQuery),
          ),
      );
    }

    return mockEvents;
  }
}