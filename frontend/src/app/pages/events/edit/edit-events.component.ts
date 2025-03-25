import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FileUploadService } from '../../../services/file-upload.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Event, UpdateEvent } from '../../../types/events';
import { EventsService } from '../../../services/events.service';
import { UserSearchComponent } from '../../../components/user-search/user-search.component';
import { UserSearchResult, UserService } from '../../../services/user.service';
import { User } from '../../../types/user';
import { OpenaiService } from '../../../services/openai.service';
import { finalize, catchError, of } from 'rxjs';
import { ImageUtilsService } from '../../../services/image-utils.service';

@Component({
  selector: 'app-edit-events',
  standalone: true,
  imports: [
    RouterModule,
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    UserSearchComponent,
    MatDialogModule,
    MatProgressBarModule,
    CommonModule,
  ],
  templateUrl: './edit-events.component.html',
  styleUrls: ['./edit-events.component.css'],
})
export class EditEventsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private eventsService = inject(EventsService);
  private userService = inject(UserService);
  private openaiService = inject(OpenaiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private location = inject(Location);
  private fileUploadService = inject(FileUploadService);
  protected images = inject(ImageUtilsService);

  eventId: string = '';
  eventForm!: FormGroup;
  users: User[] = [];
  isLoading = false;
  isLoadingEvent = true;
  isEnhancingDescription = false;
  advancedMode = false;
  event: Event | null = null;
  formChanged = false;

  selectedFile: File | null = null;
  uploadProgress: number = 0;
  imagePreview: string | null = null;

  categoryOptions = [
    { value: 'music', label: 'Musik' },
    { value: 'sports', label: 'Sport' },
    { value: 'business', label: 'Business' },
    { value: 'food', label: 'Essen & Trinken' },
    { value: 'art', label: 'Kunst' },
    { value: 'technology', label: 'Technologie' },
    { value: 'education', label: 'Bildung' },
    { value: 'social', label: 'Sozial' },
    { value: 'other', label: 'Sonstiges' },
  ];

  visibilityOptions = [
    { value: 'public', label: 'Öffentlich' },
    { value: 'private', label: 'Privat' },
    { value: 'unlisted', label: 'Nicht gelistet' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.eventId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.eventId) {
      this.handleError('Event-ID nicht gefunden');
      return;
    }

    this.loadEvent();

    this.eventForm.valueChanges.subscribe(() => {
      this.formChanged = true;
    });
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      visibility: ['public', Validators.required],
      location: [''],
      eventDate: [null, Validators.required],
      isOnline: [false],
      meetingLink: [''],
      coverImageUrl: [''],
      maxParticipants: [null],
      managers: this.fb.array([]),
      invitations: this.fb.array([]),
    });

    // Zeige den Meeting-Link-Feld nur, wenn es sich um ein Online-Event handelt
    this.eventForm.get('isOnline')?.valueChanges.subscribe((isOnline) => {
      const meetingLinkControl = this.eventForm.get('meetingLink');
      if (isOnline) {
        meetingLinkControl?.setValidators([Validators.required]);
      } else {
        meetingLinkControl?.clearValidators();
      }
      meetingLinkControl?.updateValueAndValidity();
    });
  }

  loadEvent(): void {
    this.isLoadingEvent = true;
    this.eventsService
      .getEvent(this.eventId)
      .pipe(
        finalize(() => (this.isLoadingEvent = false)),
        catchError((err) => {
          this.handleError(
            `Fehler beim Laden des Events: ${err.message || 'Unbekannter Fehler'}`,
          );
          return of(null);
        }),
      )
      .subscribe((event) => {
        if (!event) return;

        this.event = event;
        this.populateForm(event);
      });
  }

  populateForm(event: Event): void {
    // Grundlegende Felder
    this.eventForm.patchValue({
      title: event.title,
      description: event.description,
      category: event.category,
      visibility: event.visibility,
      location: event.location,
      eventDate: event.eventDate ? new Date(event.eventDate) : null,
      isOnline: event.isOnline || false,
      meetingLink: event.meetingLink || '',
      coverImageUrl: event.coverImageUrl || '',
      maxParticipants: event.maxParticipants || null,
    });

    // Manager-Daten könnten hier hinzugefügt werden, wenn sie im Event-Objekt verfügbar sind
    // Ebenso Einladungen

    setTimeout(() => {
      this.formChanged = false;
    });
  }

  get managersArray(): FormArray {
    return this.eventForm.get('managers') as FormArray;
  }

  get invitationsArray(): FormArray {
    return this.eventForm.get('invitations') as FormArray;
  }

  addManager(): void {
    const managerGroup = this.fb.group({
      userId: ['', Validators.required],
      userName: [''],
      email: [''],
    });
    this.managersArray.push(managerGroup);
  }

  addInvitation(): void {
    const invitationGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.invitationsArray.push(invitationGroup);
  }

  removeManager(index: number): void {
    this.managersArray.removeAt(index);
  }

  removeInvitation(index: number): void {
    this.invitationsArray.removeAt(index);
  }

  toggleAdvancedMode(): void {
    this.advancedMode = !this.advancedMode;
  }

  enhanceDescription(): void {
    const currentDescription = this.eventForm.get('description')?.value;
    if (!currentDescription) {
      this.snackBar.open(
        'Bitte füge zuerst eine Beschreibung hinzu',
        'Schließen',
        { duration: 3000 },
      );
      return;
    }

    this.isEnhancingDescription = true;
    this.openaiService
      .enhanceEventDescription(currentDescription)
      .pipe(finalize(() => (this.isEnhancingDescription = false)))
      .subscribe({
        next: (enhancedDescription: string) => {
          this.eventForm.patchValue({ description: enhancedDescription });
          this.snackBar.open('Beschreibung wurde verbessert!', 'Schließen', {
            duration: 3000,
          });
        },
        error: (error: any) => {
          console.error('Error enhancing description:', error);
          this.snackBar.open(
            'Fehler beim Verbessern der Beschreibung',
            'Schließen',
            { duration: 3000 },
          );
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

        // Get the backend image URL format
        const imageUrl = this.images.getImageUrl(response.filename, '');

        // Update form with the new image URL
        this.eventForm.patchValue({
          coverImageUrl: imageUrl,
        });

        // Clear the local image preview to ensure the server image is shown
        this.imagePreview = null;

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
      this.isLoading = true;

      // If there's a file to upload, do that first
      if (this.selectedFile) {
        this.uploadImage();
        return;
      }

      const updateData: UpdateEvent = this.eventForm.value;

      // Clean up empty arrays to avoid backend validation issues
      if (updateData.occurrences?.length === 0) delete updateData.occurrences;
      if (updateData.managers?.length === 0) delete updateData.managers;
      if (updateData.invitations?.length === 0) delete updateData.invitations;

      console.log('Event being updated:', updateData);

      this.eventsService.updateEvent(this.eventId, updateData).subscribe({
        next: (response: Event) => {
          this.isLoading = false;
          this.formChanged = false; // Zurücksetzen nach erfolgreicher Speicherung
          this.snackBar.open(
            'Event wurde erfolgreich aktualisiert!',
            'Schließen',
            {
              duration: 3000,
            },
          );
          this.router.navigate(['/events', response.id]);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error updating event:', error);
          this.snackBar.open(
            `Fehler beim Aktualisieren des Events: ${error.message || 'Unbekannter Fehler'}`,
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
    if (this.event) {
      this.populateForm(this.event);
      this.formChanged = false;
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  handleError(message: string): void {
    this.snackBar.open(message, 'Schließen', { duration: 5000 });
    this.router.navigate(['/dashboard']);
  }

  // Benutzersuche für Manager
  onUserSelected(user: UserSearchResult | null, index: number): void {
    if (!user) return;

    const managerGroup = this.managersArray.at(index);
    managerGroup.patchValue({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      email: user.email,
    });
  }

  cancel(): void {
    if (this.formChanged) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Änderungen verwerfen?',
          message:
            'Du hast ungespeicherte Änderungen. Möchtest du wirklich abbrechen und alle Änderungen verwerfen?',
          confirmText: 'Ja, verwerfen',
          cancelText: 'Nein, zurück zum Bearbeiten',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.navigateBack();
        }
      });
    } else {
      this.navigateBack();
    }
  }

  navigateBack(): void {
    const referrer = document.referrer;
    if (referrer.includes('/dashboard')) {
      this.router.navigate(['/dashboard']);
    } else if (referrer.includes(`/events/${this.eventId}`)) {
      this.router.navigate(['/events', this.eventId]);
    } else {
      this.location.back();
    }
  }

  // Add this new method to the class
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.eventForm.patchValue({ coverImageUrl: '' });
  }

  // Add drag and drop method
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      this.onFileSelected({ target: { files: event.dataTransfer.files } });
    }
  }
}
