import { Injectable } from '@angular/core';
import { CreateEvent, UpdateEvent } from '../types/events';
import { HttpClientService } from './httpClient.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private http: HttpClientService) {}

  getEvents() {}

  getEventById(id: string) {}

  createEvent(data: CreateEvent) {}

  updateEvent(id: string, data: UpdateEvent) {}

  deleteEvent(id: string) {}

  joinEvent(id: string) {}

  leaveEvent(id: string) {}

  /**
   * Search cities by name (autocomplete)
   * @param query The search query (city name)
   * @param limit Maximum number of results
   * @returns Observable of the city search results
   */
  searchCities(query: string, limit: number = 10): Observable<{cities: string[]}> {
    return this.http.get<{cities: string[]}>(`events/cities/search`, {
      params: { query, limit }
    });
  }
}
