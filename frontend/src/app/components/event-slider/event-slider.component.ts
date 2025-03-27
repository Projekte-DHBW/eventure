import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsService } from '../../services/events.service';
import { Event } from '../../types/events';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { ImageUtilsService } from '../../services/image-utils.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-slider',
  standalone: true,
  imports: [CommonModule, MatProgressSpinner, MatIcon],
  templateUrl: './event-slider.component.html',
  styleUrl: './event-slider.component.css',
})
export class EventSliderComponent implements AfterViewInit {
  private eventsService = inject(EventsService);
  protected images = inject(ImageUtilsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('eventSlider') eventSlider?: ElementRef;

  events: Event[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadLatestEvents();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.eventSlider?.nativeElement) {
        this.eventSlider.nativeElement.scrollLeft = 0;
      }
    }, 100);
  }

  loadLatestEvents(): void {
    this.loading = true;
    this.eventsService.getLatestEvents(10).subscribe({
      next: (events) => {
        this.events = events || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching events:', err);
        this.events = [];
        this.loading = false;
      },
    });
  }

  navigateToEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  scrollLeft(): void {
    if (this.eventSlider?.nativeElement) {
      this.eventSlider.nativeElement.scrollBy({
        left: -300,
        behavior: 'smooth',
      });
    }
  }

  scrollRight(): void {
    if (this.eventSlider?.nativeElement) {
      this.eventSlider.nativeElement.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  }
}
