import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { CreateEvent, Event } from '../../../types/events';
import { EventsService } from '../../../services/events.service';
import { UserSearchComponent } from '../../../components/user-search/user-search.component';
import { UserSearchResult, UserService } from '../../../services/user.service';
import { User } from '../../../types/user';

@Component({
  selector: 'app-create-events',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatExpansionModule,
    MatTabsModule,
    MatDividerModule,
    UserSearchComponent, // Add this import
  ],
  templateUrl: './create-events.component.html',
  styleUrls: ['./create-events.component.css'],
})
export class CreateEventsComponent implements OnInit {
  eventForm!: FormGroup;
  users: User[] = [];
  isLoading = false;
  advancedMode = false;
  
  title = new FormControl('', [Validators.required]);
  description = new FormControl('', [Validators.required]);
  visibility = new FormControl('public', [Validators.required]);
  category = new FormControl('', [Validators.required]);
  coverImageUrl = new FormControl('');
  maxParticipants = new FormControl(null, [Validators.min(1)]);
  
  // Simple event properties
  location = new FormControl('');
  eventDate = new FormControl();
  
  // Online event properties
  isOnline = new FormControl(false);
  meetingLink = new FormControl('');

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private eventsService: EventsService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    
    // Update meetingLink validation when isOnline changes
    this.isOnline.valueChanges.subscribe(isOnline => {
      if (isOnline) {
        this.meetingLink.setValidators([Validators.required]);
      } else {
        this.meetingLink.clearValidators();
      }
      this.meetingLink.updateValueAndValidity();
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      title: this.title,
      description: this.description,
      visibility: this.visibility,
      category: this.category,
      coverImageUrl: this.coverImageUrl,
      maxParticipants: this.maxParticipants,
      location: this.location,
      eventDate: this.eventDate,
      isOnline: this.isOnline,
      meetingLink: this.meetingLink,
      occurrences: this.fb.array([]),
      managers: this.fb.array([]),
      invitations: this.fb.array([])
    });
  }

  // Getters for form arrays
  get occurrences(): FormArray {
    return this.eventForm.get('occurrences') as FormArray;
  }

  get managers(): FormArray {
    return this.eventForm.get('managers') as FormArray;
  }

  get invitations(): FormArray {
    return this.eventForm.get('invitations') as FormArray;
  }

  // Methods to add items to form arrays
  addOccurrence(): void {
    const occurrenceForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: [''],
      location: this.fb.group({
        address: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        country: ['', Validators.required],
        postalCode: [''],
        latitude: [null],
        longitude: [null]
      })
    });
    this.occurrences.push(occurrenceForm);
  }

  // Modified addManager method
  addManager(): void {
    this.managers.push(this.fb.group({
      userId: ['', Validators.required],
      displayName: [''], // This is just for display purposes
    }));
  }

  addInvitation(): void {
    this.invitations.push(this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      message: ['']
    }));
  }

  removeOccurrence(index: number): void {
    this.occurrences.removeAt(index);
  }

  removeManager(index: number): void {
    this.managers.removeAt(index);
  }

  removeInvitation(index: number): void {
    this.invitations.removeAt(index);
  }

  toggleAdvancedMode(): void {
    this.advancedMode = !this.advancedMode;
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      this.isLoading = true;
      const newEvent: CreateEvent = this.eventForm.value;
      
      // Clean up empty arrays to avoid backend validation issues
      if (newEvent.occurrences?.length === 0) delete newEvent.occurrences;
      if (newEvent.managers?.length === 0) delete newEvent.managers;
      if (newEvent.invitations?.length === 0) delete newEvent.invitations;
      
      console.log('Event being created:', newEvent);

      this.eventsService.createEvent(newEvent).subscribe({
        next: (response: Event) => {
          this.isLoading = false;
          this.snackBar.open('Event wurde erfolgreich erstellt!', 'Schließen', {
            duration: 3000,
          });
          this.router.navigate(['/events', response.id]);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creating event:', error);
          this.snackBar.open(
            `Fehler beim Erstellen des Events: ${error.message || 'Unbekannter Fehler'}`,
            'Schließen',
            { duration: 5000 }
          );
        }
      });
    } else {
      this.markFormGroupTouched(this.eventForm);
      this.snackBar.open(
        'Bitte alle erforderlichen Felder ausfüllen!',
        'Schließen',
        { duration: 3000 }
      );
    }
  }

  resetForm(): void {
    this.eventForm.reset({
      visibility: 'public',
      isOnline: false
    });
    
    // Clear form arrays
    while (this.occurrences.length) {
      this.occurrences.removeAt(0);
    }
    while (this.managers.length) {
      this.managers.removeAt(0);
    }
    while (this.invitations.length) {
      this.invitations.removeAt(0);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  // Add methods to handle user selection
  onManagerSelected(user: UserSearchResult | null, index: number): void {
    if (user) {
      const managerFormGroup = this.managers.at(index) as FormGroup;
      managerFormGroup.get('userId')?.setValue(user.id);
    }
  }

  // Error message methods
  getTitleErrorMessage(): string {
    if (this.title.hasError('required')) {
      return 'Titel ist erforderlich';
    }
    return '';
  }

  getDescriptionErrorMessage(): string {
    if (this.description.hasError('required')) {
      return 'Beschreibung ist erforderlich';
    }
    return '';
  }

  getMaxParticipantsErrorMessage(): string {
    if (this.maxParticipants.hasError('min')) {
      return 'Die Teilnehmerzahl muss mindestens 1 sein';
    }
    return '';
  }
}
