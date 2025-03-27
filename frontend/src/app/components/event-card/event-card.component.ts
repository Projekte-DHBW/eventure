import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { Event } from '../../types/events';
import { ImageUtilsService } from '../../services/image-utils.service';
import { AuthService } from '../../auth/services/auth.service';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
})
export class EventCardComponent implements OnInit {
  @Input() event!: Event;
  protected images = inject(ImageUtilsService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private eventsService = inject(EventsService);
  isRegistered = false;

  ngOnInit(): void {
    this.eventsService
      .checkRegistration(this.authService.getUserId() ?? '0', this.event.id)
      .subscribe((response) => {
        this.isRegistered = response.isRegistered;
      });
  }

  navigateToEventDetails(): void {
    if (this.event && this.event.id) {
      this.router.navigate(['/events', this.event.id]);
    }
  }

  getMonthAbbreviation(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('de-DE', { month: 'short' });
    } catch (e) {
      return '';
    }
  }

  getDayFromDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.getDate().toString();
    } catch (e) {
      return '';
    }
  }

  capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}
