import { Injectable, inject } from '@angular/core';
import { CreateEvent, UpdateEvent, Event } from '../types/events';
import { HttpClientService } from './httpClient.service';
import { Observable, throwError, map, catchError, of } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { EventFilters } from '../types/EventFilter.model';

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
  creator?: string;
  creatorObj?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  attendeeCount?: number;
  creatorName?: string;
  occurrences?: Array<{
    id: string;
    startDate: string;
    endDate?: string;
    location?: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClientService);

  getEvents(filters: any = {}): Observable<{ events: Event[]; total: number }> {
    const params = this.buildQueryParams(filters);

    const options = {
      params,
      headers: {
        Accept: 'application/json',
      },
    };

    return this.http
      .get<{ events: Event[]; total: number }>('events', options)
      .pipe(
        catchError((error) => {
          console.error('API error in getEvents:', error);
          return of({ events: [], total: 0 });
        }),
      );
  }

  inviteUser(
    userId: string,
    eventId: string,
  ): Observable<{ success: boolean }> {
    const token = localStorage.getItem('accessToken');
    console.log('Token:', token);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    return this.http
      .post<{
        success: boolean;
      }>(`events/${eventId}/signup`, { userId }, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error inviting user:', error);
          return of({ success: false });
        }),
      );
  }

  getEventsByCategory(category: string, limit: number = 10): Observable<any[]> {
    const params = { limit: limit.toString() };
    return this.http.get<any[]>(`events/category/${category}`, { params });
  }

  getLatestEvents(limit: number = 10): Observable<Event[]> {
    const params = { limit: limit.toString() };

    return this.http.get<any>('events/latest', { params }).pipe(
      map((response) => {
        console.log('Latest events response:', response);

        if (Array.isArray(response)) {
          return response;
        }

        if (response && 'items' in response) {
          return response.items || [];
        }

        console.warn('Unexpected format in latest events:', response);
        return [];
      }),
      catchError((error) => {
        console.error('Error loading latest events:', error);
        return of([]);
      }),
    );
  }

  getPopularEvents(limit: number = 10): Observable<Event[]> {
    let params = new HttpParams().set('limit', limit.toString());
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

  getEvent(id: string): Observable<Event> {
    return this.http.authenticatedGet(`events/${id}`);
  }

  findOne(id: string): Observable<EventsSearchResult> {
    return this.http.get<EventsSearchResult>(`events/${id}`).pipe(
      map((event) => {
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
    let params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());

    return this.http.get<{ cities: string[] }>(`events/cities/search`, {
      params,
    });
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
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
          return of({ isRegistered: false });
        }),
      );
  }

  deleteRegistration(userId: string, eventId: string): Observable<any> {
    return this.http.authenticatedDelete(`events/${eventId}/unregister`, {
      params: { userId },
    });
  }

  private buildQueryParams(filters: EventFilters): HttpParams {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.types && filters.types.length) {
      params = params.set('types', filters.types.join(','));
    }

    if (filters.locations) {
      // Handle different formats of locations
      if (typeof filters.locations === 'string') {
        params = params.set('locations', filters.locations);
      } else if (Array.isArray(filters.locations)) {
        // Send each location as a separate query parameter with the same name
        // This allows the backend to receive them as an array
        filters.locations.forEach((location: string) => {
          params = params.append('locations', location);
        });
      }
    }

    // Other parameters
    if (filters.date) {
      params = params.set('date', filters.date);
    }

    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return params;
  }

  getUpcomingEvents(limit: number = 5): Observable<{ events: Event[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{ events: Event[] }>(`/events/upcoming`, { params });
  }

  getEventsByType(
    type: string,
    limit: number = 10,
  ): Observable<{ events: Event[] }> {
    let params = new HttpParams()
      .set('category', type)
      .set('limit', limit.toString());

    return this.http.get<{ events: Event[] }>(`/events`, {
      params,
    });
  }
}
