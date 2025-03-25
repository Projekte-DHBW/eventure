import { Component, OnInit, inject } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { CreateEvent, Event } from '../../../types/events';
import { EventsService } from '../../../services/events.service';
import { UserSearchComponent } from '../../../components/user-search/user-search.component';
import { UserSearchResult, UserService } from '../../../services/user.service';
import { User } from '../../../types/user';
import { OpenaiService } from '../../../services/openai.service';
import { finalize } from 'rxjs';
import { FileUploadService } from '../../../services/file-upload.service';
import { ImageUtilsService } from '../../../services/image-utils.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-events',
  standalone: true,
  imports: [
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
    MatTooltipModule,
    UserSearchComponent,
    MatProgressBarModule,
    CommonModule,
  ],
  templateUrl: './create-events.component.html',
  styleUrls: ['./create-events.component.css'],
})
export class CreateEventsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private eventsService = inject(EventsService);
  private userService = inject(UserService);
  private openaiService = inject(OpenaiService);
  private router = inject(Router);
  private fileUploadService = inject(FileUploadService);
  protected images = inject(ImageUtilsService);

  eventForm!: FormGroup;
  users: User[] = [];
  isLoading = false;
  isEnhancingDescription = false;
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

  // File upload properties
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  imagePreview: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();

    // Update meetingLink validation when isOnline changes
    this.isOnline.valueChanges.subscribe((isOnline) => {
      if (isOnline) {
        this.meetingLink.setValidators([Validators.required]);
      } else {
        this.meetingLink.clearValidators();
      }
      this.meetingLink.updateValueAndValidity();
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe((users) => {
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
      invitations: this.fb.array([]),
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
        longitude: [null],
      }),
    });
    this.occurrences.push(occurrenceForm);
  }

  // Modified addManager method
  addManager(): void {
    this.managers.push(
      this.fb.group({
        userId: ['', Validators.required],
        displayName: [''], // This is just for display purposes
      }),
    );
  }

  addInvitation(): void {
    this.invitations.push(
      this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        message: [''],
      }),
    );
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

  enhanceDescription(): void {
    const currentText = this.description.value;

    if (!currentText || currentText.trim() === '') {
      this.snackBar.open(
        'Bitte geben Sie zuerst eine Beschreibung ein!',
        'Schließen',
        { duration: 3000 },
      );
      return;
    }

    this.isEnhancingDescription = true;

    this.openaiService
      .enhance(currentText, this.title.value!, this.category.value!)
      .pipe(
        finalize(() => {
          this.isEnhancingDescription = false;
        }),
      )
      .subscribe({
        next: (enhancedText) => {
          console.log('Enhanced description:', enhancedText);
          this.description.setValue(enhancedText);
          this.snackBar.open('Fertig', 'Schließen', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error enhancing description:', error);
          this.snackBar.open('Fehler bei der Anfrage', 'Schließen', {
            duration: 5000,
          });
        },
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.match(/image\/*/) && file.size <= 5 * 1024 * 1024) {
      this.selectedFile = file;
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        // Auto-upload the image after selection
        this.uploadImage();
      };
      reader.readAsDataURL(file);
    } else if (file && file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Bild ist zu groß. Maximale Größe: 5MB', 'Schließen', {
        duration: 3000,
      });
    } else if (file && !file.type.match(/image\/*/)) {
      this.snackBar.open(
        'Bitte wähle ein unterstütztes Bildformat (JPG, PNG, GIF)',
        'Schließen',
        {
          duration: 3000,
        },
      );
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploadProgress = 0;

    this.fileUploadService.uploadImage(this.selectedFile).subscribe({
      next: (response) => {
        this.uploadProgress = 100;
        // Just store the filename or path, not the full URL
        this.eventForm.patchValue({
          coverImageUrl: response.filename, // or response.imageUrl if you prefer the full path
        });
        this.snackBar.open('Bild erfolgreich hochgeladen', 'Schließen', {
          duration: 3000,
        });
        this.selectedFile = null;
      },
      error: (err) => {
        this.uploadProgress = 0;
        console.error('Upload failed:', err);
        this.snackBar.open('Fehler beim Hochladen des Bildes', 'Schließen', {
          duration: 3000,
        });
      },
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      if (this.selectedFile) {
        // If there's a file selected but not uploaded yet, upload it first
        this.uploadImage();
        return;
      }

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
            { duration: 5000 },
          );
        },
      });
    } else {
      this.markFormGroupTouched(this.eventForm);
      this.snackBar.open(
        'Bitte alle erforderlichen Felder ausfüllen!',
        'Schließen',
        { duration: 3000 },
      );
    }
  }

  resetForm(): void {
    this.eventForm.reset({
      visibility: 'public',
      isOnline: false,
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

  // Add this new method to the class
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.coverImageUrl.setValue('');
  }

  // Add drag and drop method
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.onFileSelected({ target: { files: event.dataTransfer.files } });
    }
  }
}
