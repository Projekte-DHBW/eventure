import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  input,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService, UserSearchResult } from '../../services/user.service';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './user-search.component.html',
  styleUrls: ['./user-search.component.css'],
})
export class UserSearchComponent implements OnInit {
  private userService = inject(UserService);

  readonly searchType = input<'email' | 'name'>('email');
  readonly label = input('Benutzer suchen');
  readonly placeholder = input('Suchen...');
  @Output() userSelected = new EventEmitter<UserSearchResult | null>();

  searchControl = new FormControl('');
  results: UserSearchResult[] = [];
  selectedUser: UserSearchResult | null = null;
  isLoading = false;

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

          const searchType = this.searchType();
          if (
            !value ||
            (searchType === 'name' && value.trim().length < 3) ||
            (searchType === 'email' && !value.includes('@'))
          ) {
            this.isLoading = false;
            return of([]);
          }

          return this.userService.searchUsers(value, searchType).pipe(
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
