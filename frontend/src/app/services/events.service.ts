import { Injectable, inject } from '@angular/core';
import { CreateEvent, UpdateEvent, Event } from '../types/events';
import { HttpClientService } from './httpClient.service';
import { Observable, throwError, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventsSearchResult {
  id: string;
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
    id: string;
    firstName: string;
    lastName: string;
  };
  attendeeCount?: number;
  creatorName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClientService);

  // Get events with filters
  getEvents(filters: any = {}): Observable<{ events: Event[]; total: number }> {
    const params: any = {};

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();
    if (filters.types) params.types = filters.types;

    // Für Standorte, entweder als String oder als Array
    if (filters.locations) {
      if (typeof filters.locations === 'string') {
        params.locations = filters.locations;
      } else if (Array.isArray(filters.locations)) {
        params.locations = filters.locations.join(',');
      }
    }

    // Datum-Filter
    if (filters.date) {
      params.date = String(filters.date);
    }

    // Add attending filter if provided
    if (filters.attending === true) {
      params.attending = 'true';
    }

    // Spezielles Header-Flag für den HttpClient hinzufügen
    const options = {
      params,
      headers: {
        Accept: 'application/json',
      },
    };

    // Rückgabetyp auf {events, total} ändern
    return this.http
      .get<{ events: Event[]; total: number }>('events', options)
      .pipe(
        catchError((error) => {
          console.error('API error in getEvents:', error);
          return of({ events: [], total: 0 });
        }),
      );
  }

  // Methode zum Einladen eines Benutzers zu einem Event
  inviteUser(
    userId: string,
    eventId: string,
  ): Observable<{ success: boolean }> {
    const token = localStorage.getItem('accessToken'); // Holen Sie das Token aus dem Local Storage
    console.log('Token:', token); // Überprüfen Sie, ob das Token vorhanden ist

    // Spezielle Header-Flag für den HttpClientService hinzufügen
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    // Verwenden Sie den injizierten HttpClientService für die Anfrage
    return this.http
      .post<{
        success: boolean;
      }>(`events/${eventId}/signup`, { userId }, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error inviting user:', error);
          return of({ success: false }); // Fallback bei Fehler
        }),
      );
  }

  // Get events by category
  getEventsByCategory(category: string, limit: number = 10): Observable<any[]> {
    const params = { limit: limit.toString() };
    return this.http.get<any[]>(`events/category/${category}`, { params });
  }

  // Get latest events
  getLatestEvents(limit: number = 10): Observable<Event[]> {
    const params = { limit: limit.toString() };

    return this.http.get<any>('events/latest', { params }).pipe(
      map((response) => {
        console.log('Latest events response:', response);

        // Prüfen, ob die Antwort bereits ein Array ist
        if (Array.isArray(response)) {
          return response;
        }

        // Oder ob es im Format {items: Event[]} kommt
        if (response && 'items' in response) {
          return response.items || [];
        }

        // Fallback
        console.warn('Unexpected format in latest events:', response);
        return [];
      }),
      catchError((error) => {
        console.error('Error loading latest events:', error);
        return of([]);
      }),
    );
  }

  // Get popular events
  getPopularEvents(limit: number = 10): Observable<Event[]> {
    const params = { limit: limit.toString() };
    return this.http.get<any>('events/popular', { params }).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response && 'items' in response) {
          return response.items || [];
        }
        return [];
      }),
      catchError(() => of([])),
    );
  }

  // Get event by ID
  getEvent(id: string): Observable<Event> {
    return this.http.authenticatedGet(`events/${id}`);
  }

  findOne(id: string): Observable<EventsSearchResult> {
    return this.http.get<EventsSearchResult>(`events/${id}`).pipe(
      map((event) => {
        // Make sure attendeeCount is available
        return {
          ...event,
          attendeeCount: event.attendeeCount || 0,
          creatorName:
            event.creatorName ||
            (event.creator ? `User ${event.creator}` : 'Unknown'),
        };
      }),
    );
  }

  createEvent(data: CreateEvent): Observable<Event> {
    return this.http.authenticatedPost<Event>('events', data);
  }

  updateEvent(id: string, data: UpdateEvent): Observable<Event> {
    return this.http.authenticatedPatch<Event>(`events/${id}`, data);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.authenticatedDelete<void>(`events/${id}`);
  }

  joinEvent(id: string): Observable<any> {
    return this.http.authenticatedPost<any>(`events/${id}/join`, {});
  }

  leaveEvent(id: string): Observable<any> {
    return this.http.authenticatedPost<any>(`events/${id}/leave`, {});
  }

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

  /**
   * Search events with advanced filters
   * @param searchParams Search parameters object
   * @returns Observable of events matching the criteria
   */
  searchEvents(searchParams: {
    search?: string;
    types?: string[];
    locations?: string[];
    date?: string;
    page?: number;
    limit?: number;
  }): Observable<{ events: Event[]; total: number }> {
    return this.getEvents(searchParams);
  }

  /**
   * Get events created by the current user
   */
  getMyEvents(): Observable<Event[]> {
    return this.http.authenticatedGet<any[]>('events/my').pipe(
      map((events) => this.normalizeEvents(events || [])),
      catchError((error) => {
        console.error('Error loading my events:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get events the user is attending
   */
  getAttendingEvents(): Observable<Event[]> {
    return this.http.authenticatedGet<any[]>('events/attending').pipe(
      map((events) => this.normalizeEvents(events || [])),
      catchError((error) => {
        console.error('Error loading attending events:', error);
        return of([]);
      }),
    );
  }

  /**
   * Stellt sicher, dass Event-Daten die richtigen Typen haben
   */
  private normalizeEvent(event: any): Event {
    return {
      ...event,
      eventDate: event.eventDate || null,
      createdAt: event.createdAt || null,
      updatedAt: event.updatedAt || null,
    };
  }

  /**
   * Normalisiert eine Liste von Events
   */
  private normalizeEvents(events: any[]): Event[] {
    return events.map((event) => this.normalizeEvent(event));
  }

  // Methode zur Überprüfung, ob der Benutzer für ein Event registriert ist
  checkRegistration(
    userId: string,
    eventId: string,
  ): Observable<{ isRegistered: boolean }> {
    return this.http
      .authenticatedGet<{ isRegistered: boolean }>(
        `events/${eventId}/check-registration`,
        {
          params: { userId, eventId },
        },
      )
      .pipe(
        catchError((error) => {
          console.error('Error checking registration:', error);
          return of({ isRegistered: false }); // Fallback bei Fehler
        }),
      );
  }

  deleteRegistration(userId: string, eventId: string): Observable<any> {
    return this.http.authenticatedDelete(`events/${eventId}/unregister`, {
      params: { userId },
    });
  }
}
