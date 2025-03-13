import { Injectable } from '@angular/core';
import { CreateEvent, UpdateEvent } from '../types/events';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor() {}

  getEvents() {}

  getEventById(id: string) {}

  createEvent(data: CreateEvent) {}

  updateEvent(id: string, data: UpdateEvent) {}

  deleteEvent(id: string) {}

  joinEvent(id: string) {}

  leaveEvent(id: string) {}
}
