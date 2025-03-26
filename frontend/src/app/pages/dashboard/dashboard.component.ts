import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

import { EventsService } from '../../services/events.service';
import { AuthService } from '../../auth/services/auth.service';
import { Event } from '../../types/events';
import { ImageUtilsService } from '../../services/image-utils.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private eventsService = inject(EventsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  protected images = inject(ImageUtilsService);

  myEvents: Event[] = [];
  attendingEvents: Event[] = [];

  loadingMyEvents = false;
  loadingAttendingEvents = false;

  userFullName = this.authService.getFullName() || 'Benutzer';

  ngOnInit(): void {
    this.loadMyEvents();
    this.loadAttendingEvents();
  }

  loadMyEvents(): void {
    this.loadingMyEvents = true;
    this.eventsService.getMyEvents().subscribe({
      next: (events) => {
        this.myEvents = events || [];
        this.sortMyEventsByDate();
        this.loadingMyEvents = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden meiner Events:', err);
        this.loadingMyEvents = false;
      },
    });
  }

  loadAttendingEvents(): void {
    this.loadingAttendingEvents = true;
    this.eventsService.getAttendingEvents().subscribe({
      next: (events) => {
        this.attendingEvents = events || [];
        this.sortAttendingEventsByDate();
        this.loadingAttendingEvents = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden besuchter Events:', err);
        this.loadingAttendingEvents = false;
      },
    });
  }

  sortMyEventsByDate(): void {
    // Sortiert Events nach Datum (neueste zuerst)
    this.myEvents.sort((a, b) => {
      const dateA = a.eventDate
        ? new Date(a.eventDate)
        : a.createdAt
          ? new Date(a.createdAt)
          : new Date(0);
      const dateB = b.eventDate
        ? new Date(b.eventDate)
        : b.createdAt
          ? new Date(b.createdAt)
          : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  sortAttendingEventsByDate(): void {
    this.attendingEvents.sort((a, b) => {
      const now = new Date();
      const dateA = a.eventDate ? new Date(a.eventDate) : new Date(0);
      const dateB = b.eventDate ? new Date(b.eventDate) : new Date(0);

      const isPastA = dateA < now;
      const isPastB = dateB < now;

      if (isPastA && !isPastB) {
        // A ist vergangen, B nicht -> B kommt zuerst
        return 1;
      } else if (!isPastA && isPastB) {
        // A ist nicht vergangen, B ist vergangen -> A kommt zuerst
        return -1;
      } else if (!isPastA && !isPastB) {
        // Beide sind anstehend -> nach Datum sortieren (aufsteigend)
        return dateA.getTime() - dateB.getTime();
      } else {
        // Beide sind vergangen -> nach Datum sortieren (absteigend)
        return dateB.getTime() - dateA.getTime();
      }
    });
  }

  isEventPast(event: Event): boolean {
    if (!event.eventDate) return false;

    const eventDate = new Date(event.eventDate);
    const now = new Date();

    return eventDate < now;
  }

  createNewEvent(): void {
    this.router.navigate(['/events/create']);
  }

  viewEventDetails(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Kein Datum';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error);
      return 'Ungültiges Datum';
    }
  }

  getCategoryLabel(category: string): string {
    const categories: Record<string, string> = {
      music: 'Musik',
      sports: 'Sport',
      business: 'Business',
      food: 'Essen & Trinken',
      art: 'Kunst',
      technology: 'Technologie',
      education: 'Bildung',
      social: 'Sozial',
      other: 'Sonstiges',
    };

    return categories[category] || category;
  }

  deleteEvent(eventId: string): void {
    if (confirm('Möchtest du dieses Event wirklich löschen?')) {
      this.eventsService.deleteEvent(eventId).subscribe({
        next: () => {
          this.myEvents = this.myEvents.filter((event) => event.id !== eventId);
        },
        error: (err) => {
          console.error('Fehler beim Löschen des Events:', err);
          alert(
            'Das Event konnte nicht gelöscht werden. Bitte versuche es später erneut.',
          );
        },
      });
    }
  }

  getEventDay(dateString?: string): number {
    if (!dateString) return 1;
    try {
      return new Date(dateString).getDate();
    } catch (error) {
      console.error('Error getting date day:', error);
      return 1;
    }
  }

  getEventMonth(dateString?: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        month: 'short',
      });
    } catch (error) {
      console.error('Error getting date month:', error);
      return '';
    }
  }
}
