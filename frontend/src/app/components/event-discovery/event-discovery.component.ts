import { Component, inject, input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { LocationInputComponent } from '../../location-input/location-input.component';
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
    LocationInputComponent,
  ],
  templateUrl: './event-discovery.component.html',
  styleUrl: './event-discovery.component.css',
})
export class EventDiscoveryComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly types = input(['Musik', 'Sport', 'Kultur', 'Anderes']);

  readonly locations = ['Berlin', 'München', 'Heidenheim', 'Köln'];

  readonly dates = [
    'Heute',
    'Morgen',
    'Diese Woche',
    'Diesen Monat',
    'Dieses Jahr',
  ];

  eventSearchForm: FormGroup;
  locationControl = new FormControl('');
  isLoading = false;

  constructor() {
    this.eventSearchForm = this.fb.group({
      eventType: [''],
      location: [''],
      date: [''],
    });
  }

  searchEvents(): void {
    if (this.eventSearchForm.valid) {
      const formValues = this.eventSearchForm.value;
      const queryParams: any = {};

      if (formValues.eventType) {
        queryParams.types = [formValues.eventType];
      }

      if (formValues.location) {
        queryParams.locations = [formValues.location];
      }

      if (formValues.date) {
        queryParams.date = formValues.date.toLowerCase();
      }

      console.log('Navigating to search with params:', queryParams);

      this.router.navigate(['/search'], {
        queryParams: queryParams,
      });
    }
  }

  onLocationSelected(location: string): void {
    this.eventSearchForm.get('location')?.setValue(location);
  }
}
