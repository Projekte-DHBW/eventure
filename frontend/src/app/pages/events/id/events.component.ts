import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import {
  EventsSearchResult,
  EventsService,
} from '../../../services/events.service';
import { Event } from '../../../types/events';
import {
  FormControl,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../types/user';
import { ChangeDetectorRef } from '@angular/core';
import { ImageUtilsService } from '../../../services/image-utils.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';

interface EventOccurrence {
  id: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

@Component({
  selector: 'app-events',
  imports: [
    RouterModule,
    MatCardModule,
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule,
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
})
export class EventsComponent implements OnInit {
  @Output() eventSelected = new EventEmitter<EventsSearchResult | null>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private changeDetector = inject(ChangeDetectorRef);
  protected images = inject(ImageUtilsService);

  searchControl = new FormControl('');
  results: EventsSearchResult[] = [];

  isLoading = false;
  isRegistered: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  users: User[] = [];

  linkCopied = false;
  shareTimer: any;

  constructor(
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
  ) {
    registerLocaleData(localeDe);

    this.registerCustomIcons();
  }

  signUpForm: FormGroup = this.fb.group({
    userID: ['', Validators.required],
    eventID: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    const userID = this.authService.getUserId() as string;
    console.log('UserID: ', userID);

    console.log('Form invalid:', this.signUpForm.invalid);

    if (id && userID) {
      this.signUpForm.patchValue({ eventID: id, userID: userID });
      this.eventsService.findOne(id).subscribe(
        (result) => {
          this.results = [result];
          console.log('Ergebnisse:', this.results);

          this.sortOccurrences();
        },
        (error) => {
          this.errorMessage = 'Fehler beim Laden der Eventdaten';
          console.error('Fehler:', error);
        },
      );

      this.eventsService.checkRegistration(userID, id).subscribe(
        (response) => {
          this.isRegistered = response.isRegistered;
        },
        (error) => {
          this.errorMessage = 'Fehler beim Überprüfen der Registrierung';
          console.error('Fehler:', error);
        },
      );
    }
  }

  onSubmit(): void {
    if (this.signUpForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { userID, eventID } = this.signUpForm.value;

    this.eventsService.inviteUser(userID, eventID).subscribe({
      next: () => {
        this.successMessage =
          'Sie haben sich erfolgreich für das Event angemeldet!';
        this.isRegistered = true;
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Fehler beim ihrer Anmeldung: ' + error.message;
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  onDeleteRegistration(eventId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const userID = this.authService.getUserId() as string;

    this.eventsService.deleteRegistration(userID, eventId).subscribe({
      next: () => {
        this.successMessage = 'Sie haben sich erfolgreich abgemeldet!';
        this.isRegistered = false;
      },
      error: (error) => {
        this.errorMessage = 'Fehler bei der Abmeldung: ' + error.message;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  get event(): EventsSearchResult {
    return this.results[0];
  }

  getVisibilityLabel(visibility: string): string {
    switch (visibility) {
      case 'public':
        return 'Öffentlich';
      case 'private':
        return 'Privat';
      case 'unlisted':
        return 'Nicht gelistet';
      default:
        return 'Unbekannt';
    }
  }

  getCapacityPercentage(): number {
    if (
      !this.event ||
      !this.event.maxParticipants ||
      typeof this.event.attendeeCount !== 'number'
    ) {
      return 0;
    }

    const percentage =
      (this.event.attendeeCount / this.event.maxParticipants) * 100;
    return Math.min(percentage, 100);
  }

  private registerCustomIcons() {
    this.iconRegistry.addSvgIcon(
      'facebook',
      this.sanitizer.bypassSecurityTrustResourceUrl('/facebook.svg'),
    );
    this.iconRegistry.addSvgIcon(
      'twitter',
      this.sanitizer.bypassSecurityTrustResourceUrl('/twitter.svg'),
    );
    this.iconRegistry.addSvgIcon(
      'whatsapp',
      this.sanitizer.bypassSecurityTrustResourceUrl('/whatsapp.svg'),
    );
  }

  copyEventLink(): void {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      this.linkCopied = true;

      if (this.shareTimer) {
        clearTimeout(this.shareTimer);
      }

      this.shareTimer = setTimeout(() => {
        this.linkCopied = false;
      }, 3000);
    });
  }

  shareViaEmail(): void {
    const subject = encodeURIComponent(`Einladung: ${this.event.title}`);
    const body = encodeURIComponent(
      `Hallo,\n\nIch möchte dich zu diesem Event einladen: ${this.event.title}\n\n` +
        `Datum: ${this.event.eventDate ? new Date(this.event.eventDate).toLocaleDateString('de-DE') : 'Nicht angegeben'}\n` +
        `Ort: ${this.event.isOnline ? 'Online' : this.event.location || 'Nicht angegeben'}\n\n` +
        `Hier ist der Link zum Event: ${window.location.href}\n\n` +
        `Viele Grüße`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  shareToWhatsApp(): void {
    const text = encodeURIComponent(
      `Schau dir dieses Event an: ${this.event.title} - ${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  shareToTwitter(): void {
    const text = encodeURIComponent(
      `${this.event.title} ${window.location.href}`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }

  shareToFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
    );
  }

  getOccurrenceStatus(occurrence: EventOccurrence): string {
    const now = new Date();
    const startDate = new Date(occurrence.startDate);
    const endDate = occurrence.endDate ? new Date(occurrence.endDate) : null;

    if (endDate && now > endDate) {
      return 'past';
    } else if (now >= startDate && (!endDate || now <= endDate)) {
      return 'active';
    } else {
      return 'upcoming';
    }
  }

  getStatusLabel(occurrence: EventOccurrence): string {
    const status = this.getOccurrenceStatus(occurrence);

    switch (status) {
      case 'upcoming':
        return 'Bevorstehend';
      case 'active':
        return 'Aktuell';
      case 'past':
        return 'Vergangen';
      default:
        return '';
    }
  }

  formatTimeRange(occurrence: EventOccurrence): string {
    if (!occurrence.startDate) return '';

    const startTime = new Date(occurrence.startDate).toLocaleTimeString(
      'de-DE',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    if (!occurrence.endDate) return startTime;

    const endTime = new Date(occurrence.endDate).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${startTime} - ${endTime}`;
  }

  sortOccurrences(): void {
    if (
      this.event &&
      this.event.occurrences &&
      this.event.occurrences.length > 0
    ) {
      this.event.occurrences.sort((a, b) => {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      });
    }
  }
}
