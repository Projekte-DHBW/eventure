import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateEvent } from '../../../types/events';

@Component({
  selector: 'app-create-events',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './create-events.component.html',
  styleUrls: ['./create-events.component.css'],
})
export class CreateEventsComponent implements OnInit {
  eventForm!: FormGroup;

  title = new FormControl('', [Validators.required]);
  description = new FormControl('', [Validators.required]);
  visibility = new FormControl('public', [Validators.required]);
  category = new FormControl('', [Validators.required]);
  coverImageUrl = new FormControl('');
  maxParticipants = new FormControl(null, [Validators.min(1)]);

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      title: this.title,
      description: this.description,
      visibility: this.visibility,
      category: this.category,
      coverImageUrl: this.coverImageUrl,
      maxParticipants: this.maxParticipants,
    });
  }

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

  onSubmit(): void {
    if (this.eventForm.valid) {
      const newEvent: CreateEvent = this.eventForm.value;

      console.log('Event erstellt:', newEvent);

      this.snackBar.open('Event wurde erfolgreich erstellt!', 'Schließen', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      this.resetForm();
    } else {
      this.snackBar.open(
        'Bitte alle erforderlichen Felder ausfüllen!',
        'Schließen',
        {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        },
      );

      this.markFormGroupTouched(this.eventForm);
    }
  }

  resetForm(): void {
    this.eventForm.reset({
      visibility: 'public',
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
