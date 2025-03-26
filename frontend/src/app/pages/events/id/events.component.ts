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

  // Add new properties for sharing
  linkCopied = false;
  shareTimer: any;

  constructor(
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
  ) {
    // Register German locale
    registerLocaleData(localeDe);

    // Register custom icons for social sharing
    this.registerCustomIcons();
  }

  signUpForm: FormGroup = this.fb.group({
    userID: ['', Validators.required],
    eventID: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Extrahierte ID:', id); // Debug-Ausgabe hinzufügen

    //const { userID, eventID } = this.signUpForm.value;

    const userID = this.authService.getUserId() as string;
    console.log('UserID: ', userID);

    console.log('Form invalid:', this.signUpForm.invalid); // Debug-Ausgabe

    if (id && userID) {
      // Überprüfen, ob eventID und userid nicht null ist
      this.signUpForm.patchValue({ eventID: id, userID: userID });
      this.eventsService.findOne(id).subscribe(
        (result) => {
          // Hier können Sie die API-Daten anpassen, falls nötig
          this.results = [result];
          console.log('Ergebnisse:', this.results); // Debug-Ausgabe
        },
        (error) => {
          this.errorMessage = 'Fehler beim Laden der Eventdaten';
          console.error('Fehler:', error);
        },
      );

      // Überprüfung der Registrierung
      this.eventsService.checkRegistration(userID, id).subscribe(
        (response) => {
          //this.signUpForm.patchValue({ userID: userID });
          this.isRegistered = response.isRegistered;
          console.log('Is Registered:', this.isRegistered); // Debug-Ausgabe
          //this.successMessage = 'Sie sind bereits angemeldet.';
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

    // Benutzer zu einem Event einladen
    this.eventsService.inviteUser(userID, eventID).subscribe({
      next: () => {
        this.successMessage =
          'Sie haben sich erfolgreich für das Event angemeldet!';
        this.isRegistered = true; // Aktualisiere den Registrierungsstatus
        this.isLoading = false;
        this.changeDetector.detectChanges(); // Manuelle Änderungserkennung
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
        this.isRegistered = false; // Setze den Registrierungsstatus zurück
      },
      error: (error) => {
        this.errorMessage = 'Fehler bei der Abmeldung: ' + error.message;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  // Helper getter for the current event
  get event(): EventsSearchResult {
    return this.results[0];
  }

  // Get visibility label for display
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

  // Update the getCapacityPercentage method
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
    return Math.min(percentage, 100); // Ensure it doesn't go over 100%
  }

  // Add this method to register custom icons
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

  // Copy event link to clipboard
  copyEventLink(): void {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      this.linkCopied = true;

      // Clear previous timer if it exists
      if (this.shareTimer) {
        clearTimeout(this.shareTimer);
      }

      // Hide the "copied" message after 3 seconds
      this.shareTimer = setTimeout(() => {
        this.linkCopied = false;
      }, 3000);
    });
  }

  // Share via email
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

  // Share to WhatsApp
  shareToWhatsApp(): void {
    const text = encodeURIComponent(
      `Schau dir dieses Event an: ${this.event.title} - ${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  // Share to Twitter
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
}
