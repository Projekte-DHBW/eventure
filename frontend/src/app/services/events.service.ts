import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateEvent, UpdateEvent, Event } from '../types/events';
import { HttpClientService } from './httpClient.service';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs';

export interface EventsSearchResult {
  id: string; // Add this property
  title: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  category: 'music' | 'sports' | 'culture' | 'other';
  coverImageUrl?: string;
  maxParticipants?: number;
  location?: string;
  eventDate?: Date;
  isOnline?: boolean;
  meetingLink?: string;
  creator?: string; // User ID of creator
  creatorObj?: {
    // Optional creator object
    id: string;
    firstName: string;
    lastName: string;
  };
    
}
  



@Injectable({
  providedIn: 'root',
})
export class EventsService {

  //private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClientService) {}

  getEvents() {}

  findOne(id: string): Observable<EventsSearchResult> {
    return this.http.authenticatedGet<EventsSearchResult>(`events/${id}`, {
      params: { id },
    });
    // return this.http.get<Event>(`${this.apiUrl}/events/${id}`);
      //.post<Event>(`${this.apiUrl}/events/${id}`, { id })
      //.pipe(catchError((error) => this.handleError(error)),
    //);
  }

  createEvent(data: CreateEvent): Observable<Event> {
    return this.http.post<Event>('events', data);
  }

  updateEvent(id: string, data: UpdateEvent) {}

  deleteEvent(id: string) {}

  joinEvent(id: string) {
  }

  leaveEvent(id: string) {}

  /**
   * Search cities by name (autocomplete)
   * @param query The search query (city name)
   * @param limit Maximum number of results
   * @returns Observable of the city search results
   */
  searchCities(
    query: string,
    limit: number = 10,
  ): Observable<{ cities: string[] }> {
    return this.http.get<{ cities: string[] }>(`events/cities/search`, {
      params: { query, limit },
    });
  }

private handleError(error: any): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || 'Server error';
    }
    return throwError(() => new Error(errorMessage));
  }

}
