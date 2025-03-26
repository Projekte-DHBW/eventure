import { Component, type OnInit, input, inject } from '@angular/core';
import {
  FormBuilder,
  type FormGroup,
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
import { type Observable, of } from 'rxjs';
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
    this.filteredCities = this.locationControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter((query) => typeof query === 'string'),
      tap(() => (this.isLoading = true)),
      switchMap((query) => {
        if (!query || query.length < 2) {
          return of(this.locations());
        }

        return this.eventsService.searchCities(query).pipe(
          tap((res) => console.log('Cities API response:', res)),
          map((response) => response.cities),
          catchError(() => {
            console.error('Error fetching cities');
            return of(this.locations());
          }),
        );
      }),
      tap(() => (this.isLoading = false)),
    );
  }

  searchEvents(): void {
    if (this.eventSearchForm.valid) {
      const formValues = this.eventSearchForm.value;

      interface QueryParams {
        type?: string;
        location?: string;
        date?: string;
      }

      const queryParams: QueryParams = {};

      if (formValues.eventType) {
        queryParams.type = formValues.eventType;
      }

      if (formValues.location) {
        queryParams.location = formValues.location;
      }

      if (formValues.date) {
        queryParams.date = formValues.date;
      }

      this.router.navigate(['/search'], {
        queryParams: queryParams,
      });
    }
  }

  displayCity(city: string): string {
    return city ? city : '';
  }
}
