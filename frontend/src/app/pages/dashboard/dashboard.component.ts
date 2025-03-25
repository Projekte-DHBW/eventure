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
  pastEvents: Event[] = [];
  upcomingEvents: Event[] = [];

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
    // Verwende die spezifische Methode statt des Filters
    this.eventsService.getAttendingEvents().subscribe({
      next: (events) => {
        this.attendingEvents = events || [];
        this.categorizeAttendingEvents();
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
      // Sichere Date-Konvertierung mit Fallbacks
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

  categorizeAttendingEvents(): void {
    const now = new Date();

    this.pastEvents = this.attendingEvents.filter((event) => {
      // Sichere Prüfung auf gültiges Datum
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      return eventDate < now;
    });

    this.upcomingEvents = this.attendingEvents.filter((event) => {
      // Sichere Prüfung auf gültiges Datum
      if (!event.eventDate) return true; // Events ohne Datum gelten als zukünftig
      const eventDate = new Date(event.eventDate);
      return eventDate >= now;
    });

    // Sortieren nach Datum
    this.pastEvents.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate) : new Date(0);
      const dateB = b.eventDate ? new Date(b.eventDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    this.upcomingEvents.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate) : new Date(0);
      const dateB = b.eventDate ? new Date(b.eventDate) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  }

  createNewEvent(): void {
    this.router.navigate(['/events/create']);
  }

  viewEventDetails(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  // Sicheres Formatieren von Datumsangaben
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

  // Helper method to get the day number from a date string
  getEventDay(dateString?: string): number {
    if (!dateString) return 1;
    try {
      return new Date(dateString).getDate();
    } catch (error) {
      console.error('Error getting date day:', error);
      return 1;
    }
  }

  // Helper method to get the month abbreviation from a date string
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
