import {
  Component,
  Input,
  OnInit,
  forwardRef,
  inject,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  Observable,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  startWith,
  switchMap,
  tap,
  catchError,
  defaultIfEmpty,
} from 'rxjs';
import { EventsService } from '../services/events.service';

@Component({
  selector: 'app-location-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatChipsModule,
  ],
  templateUrl: './location-input.component.html',
  styleUrl: './location-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationInputComponent),
      multi: true,
    },
  ],
})
export class LocationInputComponent implements OnInit, ControlValueAccessor {
  private eventsService = inject(EventsService);

  @Input() placeholder = 'Stadt eingeben...';
  @Input() label = 'Standort';
  @Input() appearance: 'outline' | 'fill' = 'outline';
  @Input() multiple = false; // Whether multiple locations can be selected
  @Input() defaultLocations: string[] = []; // Default locations for multi-select mode

  // Default cities displayed as suggestions
  @Input() defaultCities: string[] = ['Berlin', 'Hamburg', 'München'];

  locationSelected = output<string>(); // Emit when a location is selected

  locationControl = new FormControl('');
  filteredCities: Observable<string[]> = of([]);
  isLoading = false;

  // ControlValueAccessor methods
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;

  ngOnInit(): void {
    this.setupAutocomplete();
  }

  writeValue(value: any): void {
    if (!this.multiple) {
      this.locationControl.setValue(value || '', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.locationControl.disable();
    } else {
      this.locationControl.enable();
    }
  }

  private setupAutocomplete(): void {
    // Initialize with default cities, not empty array
    this.filteredCities = this.locationControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter((query) => typeof query === 'string'),
      tap(() => (this.isLoading = true)),
      switchMap((query) => {
        if (!query || query.length < 2) {
          return of(this.defaultCities);
        }

        return this.eventsService.searchCities(query).pipe(
          map((response) => {
            // Ensure we always have an array even if the response is invalid
            return Array.isArray(response?.cities) ? response.cities : [];
          }),
          catchError(() => {
            console.error('Error fetching cities');
            return of(this.defaultCities);
          }),
        );
      }),
      tap(() => (this.isLoading = false)),
      // These safety operators ensure we always have an array
      map((cities) => (Array.isArray(cities) ? cities : [])),
      defaultIfEmpty([]),
    );
  }

  displayCity(city: string): string {
    return city || '';
  }

  selectLocation(location: string): void {
    if (!location || location.trim() === '') return;

    if (this.multiple) {
      // Just clear the input field and emit the event
      this.locationControl.setValue('');
      // Emit the event to notify parent components
      this.locationSelected.emit(location);
    } else {
      this.onChange(location);
      this.onTouched();
      this.locationSelected.emit(location);
    }
  }

  onOptionSelected(event: any): void {
    const value = event.option.value;
    this.selectLocation(value);
  }
}
