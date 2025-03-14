import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
} from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UserService, UserSearchResult } from '../../services/user.service';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="user-search">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>{{ label }}</mat-label>
        <input
          type="text"
          matInput
          [formControl]="searchControl"
          [placeholder]="placeholder"
          [matAutocomplete]="auto"
          (blur)="onBlur()"
        />
        <mat-hint *ngIf="searchType === 'email'"
          >Geben Sie die vollständige E-Mail-Adresse ein</mat-hint
        >
        <mat-hint *ngIf="searchType === 'name'"
          >Mindestens 3 Zeichen eingeben</mat-hint
        >
        <mat-icon matSuffix>{{ isLoading ? 'sync' : 'search' }}</mat-icon>
        <mat-autocomplete
          #auto="matAutocomplete"
          [displayWith]="displayFn"
          (optionSelected)="onOptionSelected($event)"
        >
          <mat-option *ngIf="isLoading" disabled>
            <span>Suche...</span>
          </mat-option>
          <ng-container *ngIf="!isLoading">
            <mat-option *ngIf="results.length === 0" disabled>
              Keine Ergebnisse gefunden
            </mat-option>
            <mat-option *ngFor="let user of results" [value]="user">
              {{ user.firstName }} {{ user.lastName }}
            </mat-option>
          </ng-container>
        </mat-autocomplete>
      </mat-form-field>

      <div *ngIf="selectedUser" class="selected-user">
        <span class="user-name"
          >{{ selectedUser.firstName }} {{ selectedUser.lastName }}</span
        >
        <button mat-icon-button (click)="clearSelection()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .user-search {
        display: flex;
        flex-direction: column;
      }
      .search-field {
        width: 100%;
      }
      .selected-user {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        background-color: #e3f2fd;
        border-radius: 4px;
        margin-top: 8px;
      }
      .user-name {
        font-weight: 500;
      }
      mat-icon {
        animation: none;
      }
      mat-icon.spinning {
        animation: spin 1s infinite linear;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class UserSearchComponent implements OnInit {
  @Input() searchType: 'email' | 'name' = 'email';
  @Input() label = 'Benutzer suchen';
  @Input() placeholder = 'Suchen...';
  @Output() userSelected = new EventEmitter<UserSearchResult | null>();

  searchControl = new FormControl('');
  results: UserSearchResult[] = [];
  selectedUser: UserSearchResult | null = null;
  isLoading = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.isLoading = true)),
        switchMap((value) => {
          // Don't search if value is an object (selected from dropdown) or too short
          if (typeof value !== 'string') {
            this.isLoading = false;
            return of([]);
          }

          if (
            !value ||
            (this.searchType === 'name' && value.trim().length < 3) ||
            (this.searchType === 'email' && !value.includes('@'))
          ) {
            this.isLoading = false;
            return of([]);
          }

          return this.userService.searchUsers(value, this.searchType).pipe(
            catchError(() => {
              this.isLoading = false;
              return of([]);
            }),
          );
        }),
      )
      .subscribe((results) => {
        this.results = results;
        this.isLoading = false;
      });
  }

  displayFn(user: UserSearchResult): string {
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  onOptionSelected(event: any): void {
    this.selectedUser = event.option.value;
    this.userSelected.emit(this.selectedUser);
  }

  clearSelection(): void {
    this.selectedUser = null;
    this.searchControl.setValue('');
    this.userSelected.emit(null);
  }

  onBlur(): void {
    // Clear text input if no user is selected
    if (!this.selectedUser && typeof this.searchControl.value === 'string') {
      setTimeout(() => {
        this.searchControl.setValue('');
      }, 200);
    }
  }
}
