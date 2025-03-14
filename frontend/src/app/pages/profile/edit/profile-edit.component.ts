import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css'],
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  avatarColor: string;
  userInitials: string = '';

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.profileForm = this.createForm();
    this.avatarColor = this.generateAvatarColor();
  }

  ngOnInit(): void {
    // Simulate user data loading
    setTimeout(() => {
      this.loadUserData();
    }, 500);
  }

  createForm(): FormGroup {
    return this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        currentPassword: [''],
        newPassword: ['', [Validators.minLength(8)]],
        confirmPassword: [''],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    // If either password field is empty, don't validate matching
    if (!newPassword && !confirmPassword) {
      return null;
    }

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  loadUserData(): void {
    // Mock user data
    const userData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
    };

    this.profileForm.patchValue(userData);
    this.updateUserInitials(userData.firstName, userData.lastName);
  }

  updateUserInitials(firstName: string, lastName: string): void {
    this.userInitials =
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  generateAvatarColor(): string {
    // Generate a random color
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const formValues = this.profileForm.value;

      // Update initials if name changed
      this.updateUserInitials(formValues.firstName, formValues.lastName);

      // Mock API call
      console.log('Form submitted:', formValues);

      this.snackBar.open('Profile updated successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      // Reset password fields
      this.profileForm.patchValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }

  resetForm(): void {
    this.loadUserData();
    this.profileForm.patchValue({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    this.snackBar.open('Form reset!', 'Close', {
      duration: 2000,
    });
  }
}
