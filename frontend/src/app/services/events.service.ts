import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateEvent, UpdateEvent } from '../types/events';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class EventsService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor() { }

  getEvents() {

  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/events/${id}`);
      //.post<Event>(`${this.apiUrl}/events/${id}`, { id })
      //.pipe(catchError((error) => this.handleError(error)),
    //);
  }

  createEvent(data: CreateEvent) {

  }

  updateEvent(id: string, data: UpdateEvent) {
  }

  deleteEvent(id: string) {
  }

  joinEvent(id: string) {
  }

  leaveEvent(id: string) {
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
