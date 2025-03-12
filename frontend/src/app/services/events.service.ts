import { Injectable } from '@angular/core';
import type {  ICreateEvent } from '../../../../backend/src/events/dto/CreateEvent';

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  constructor() { }

  getEvents() {

  }

  getEventById(id: string) {

  }

  createEvent(data: ICreateEvent) {

  }

  updateEvent(id: string, data: Partial<ICreateEvent>) {
  }

  deleteEvent(id: string) {
  }

  joinEvent(id: string) {
  }

  leaveEvent(id: string) {
  }
}
