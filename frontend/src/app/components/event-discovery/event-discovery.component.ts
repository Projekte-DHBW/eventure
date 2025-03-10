import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-event-discovery',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './event-discovery.component.html',
  styleUrl: './event-discovery.component.css',
})
export class EventDiscoveryComponent implements OnInit {
  @Input() type = [
    'Konzert',
    'Festival',
    'Theater',
    'Sport',
    'Kunst',
    'Kultur',
  ];
  @Input() location = ['Berlin', 'München', 'Heidenheim', 'Köln'];
  @Input() date = [
    'Heute',
    'Morgen',
    'Diese Woche',
    'Diesen Monat',
    'Dieses Jahr',
  ];

  eventSearchForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.eventSearchForm = this.fb.group({
      eventType: [''],
      location: [''],
      date: [''],
    });
  }

  ngOnInit(): void {}

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
}
