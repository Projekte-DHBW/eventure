import { Injectable, inject } from '@angular/core';
import { CreateEvent, UpdateEvent, Event } from '../types/events';
import { HttpClientService } from './httpClient.service';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClientService);

  // Get events with filters
  getEvents(filters: any = {}): Observable<[Event[], number]> {
    const params: any = {};

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();
    if (filters.types) params.types = filters.types; // Kann String oder Array sein

    // Für Standorte, entweder als String oder als Array
    if (filters.locations) {
      if (typeof filters.locations === 'string') {
        params.locations = filters.locations;
      } else if (Array.isArray(filters.locations)) {
        params.locations = filters.locations.join(',');
      }
    }

    // Datum-Filter - Korrigiert
    if (filters.date) {
      // Stellen wir sicher, dass das Datum als String übergeben wird
      params.date = String(filters.date);
      console.log(`Setting date param to: ${params.date}`);
    }

    // Add attending filter if provided
    if (filters.attending === true) {
      params.attending = 'true';
    }

    console.log('Sending API request with params:', params);

    // Hinzugefügt: Debugging-Info für die URL
    const url = new URLSearchParams(params).toString();
    console.log('Query string that would be sent:', url);

    // Spezielles Header-Flag für den HttpClient hinzufügen
    const options = {
      params,
      headers: {
        Accept: 'application/json',
      },
    };

    return this.http.get<any>('events', options).pipe(
      map((response) => {
        console.log('API response:', response);

        // Prüfen, ob die Antwort bereits das gewünschte Format hat [Event[], number]
        if (
          Array.isArray(response) &&
          response.length === 2 &&
          Array.isArray(response[0])
        ) {
          return response as [Event[], number];
        }

        // Oder ob es das Format {items: Event[], count: number} hat
        if (response && 'items' in response) {
          const items = response.items || [];
          const count = response.count || 0;
          return [items, count] as [Event[], number];
        }

        // Fallback für andere Formate
        console.warn('Unexpected API response format:', response);
        return [[], 0] as [Event[], number];
      }),
      catchError((error) => {
        console.error('API error in getEvents:', error);
        return of([[], 0] as [Event[], number]);
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
  }): Observable<[Event[], number]> {
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
}
