import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './httpClient.service';
import { User } from '../types/user';

export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
}

export interface UserInviteResult {
  exists: boolean;
  user?: UserSearchResult;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClientService);


  /**
   * Get all users (admin access only, should be restricted)
   */
  getUsers(): Observable<User[]> {
    return this.http.authenticatedGet<User[]>('users');
  }

  /**
   * Search for users by email (exact match) or by name (partial match)
   * @param query The search term
   * @param type The type of search: 'email' or 'name'
   * @returns Observable of user search results
   */
  searchUsers(
    query: string,
    type: 'email' | 'name' = 'email',
  ): Observable<UserSearchResult[]> {
    return this.http.authenticatedGet<UserSearchResult[]>('users/search', {
      params: { query, type },
    });
  }

  /**
   * Invite a user by email
   * @param email The email to invite
   * @param eventId Optional event ID to invite the user to
   * @param message Optional personalized message
   * @returns Observable with information if the user exists
   */
  inviteByEmail(
    email: string,
    eventId?: string,
    message?: string,
  ): Observable<UserInviteResult> {
    return this.http.authenticatedPost<UserInviteResult>('users/invite', {
      email,
      eventId,
      message,
    });
  }
}
