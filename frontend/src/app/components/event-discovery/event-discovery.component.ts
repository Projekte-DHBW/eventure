import { Component, OnInit, input, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
  startWith,
  filter,
  map,
} from 'rxjs/operators';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-event-discovery',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  templateUrl: './event-discovery.component.html',
  styleUrl: './event-discovery.component.css',
})
export class EventDiscoveryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private eventsService = inject(EventsService);

  readonly types = input([
    'Konzert',
    'Festival',
    'Theater',
    'Sport',
    'Kunst',
    'Kultur',
]);

  // Keep a static list as fallback, but we'll replace with API data
  readonly locations = input(['Berlin', 'München', 'Heidenheim', 'Köln']);

  readonly dates = input([
    'Heute',
    'Morgen',
    'Diese Woche',
    'Diesen Monat',
    'Dieses Jahr',
]);

  eventSearchForm: FormGroup;
  locationControl = new FormControl('');
  filteredCities: Observable<string[]> | undefined;
  isLoading = false;

  constructor() {
    this.eventSearchForm = this.fb.group({
      eventType: [''],
      location: this.locationControl,
      date: [''],
    });
  }

  ngOnInit(): void {
    // Initialize city autocomplete
    this.filteredCities = this.locationControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter((query) => typeof query === 'string'),
      tap(() => (this.isLoading = true)),
      switchMap((query) => {
        if (!query || query.length < 2) {
          return of(this.locations()); // Return default locations for empty query
        }

        return this.eventsService.searchCities(query).pipe(
          tap((res) => console.log('Cities API response:', res)),
          map((response) => response.cities),
          catchError(() => {
            console.error('Error fetching cities');
            return of(this.locations()); // Fallback to static list on error
          }),
        );
      }),
      tap(() => (this.isLoading = false)),
    );
  }

  searchEvents(): void {
    if (this.eventSearchForm.valid) {
      const formValues = this.eventSearchForm.value;

      // Create query parameters object
      const queryParams: any = {};

      // Only add parameters that have values
      if (formValues.eventType) {
        queryParams.type = formValues.eventType;
      }

      if (formValues.location) {
        queryParams.location = formValues.location;
      }

      if (formValues.date) {
        queryParams.date = formValues.date;
      }

      // Navigate to search page with query parameters
      this.router.navigate(['/search'], {
        queryParams: queryParams,
      });
    }
  }

  // Helper method for the template
  displayCity(city: string): string {
    return city ? city : '';
  }
}
