import { Component, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsService } from '../../services/events.service';
import { Event } from '../../types/events';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-event-slider',
  imports: [CommonModule, MatProgressSpinner, MatIcon],
  templateUrl: './event-slider.component.html',
  styleUrl: './event-slider.component.css',
})
export class EventSliderComponent {
  private eventsService = inject(EventsService);

  @ViewChild('eventSlider', { static: false }) eventSlider!: ElementRef;

  events: Event[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadLatestEvents();
  }

  loadLatestEvents(): void {
    this.loading = true;
    this.eventsService.getLatestEvents(10).subscribe({
      next: (events) => {
        console.log('Loaded events:', events);
        this.events = events || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        this.events = [];
        this.loading = false;
      },
    });
  }

  scrollLeft() {
    this.eventSlider.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight() {
    this.eventSlider.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }
}
