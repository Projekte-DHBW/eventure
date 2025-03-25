import { Component, OnInit, Output, EventEmitter, inject} from '@angular/core';
//import { ActivatedRoute } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { EventsSearchResult, EventsService } from '../../../services/events.service';
import { Event } from '../../../types/events';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../types/user';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-events',
  imports: [
    RouterModule,
    MatCardModule,
    CommonModule,
    MatBadgeModule,
    MatButtonModule,
    RouterModule,
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit{
  @Output() eventSelected = new EventEmitter<EventsSearchResult | null>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private changeDetector = inject(ChangeDetectorRef);

  searchControl = new FormControl('');
  results: EventsSearchResult[] = [];

  isLoading = false;
  isRegistered: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;


  users: User[] = [];

  constructor(private route: ActivatedRoute, private eventsService: EventsService) {}

  signUpForm: FormGroup = this.fb.group({
    userID: ['', Validators.required],
    eventID: ['', Validators.required],
  })


  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');
    console.log('Extrahierte ID:', id); // Debug-Ausgabe hinzufügen

    //const { userID, eventID } = this.signUpForm.value;

    const userID = this.authService.getUserId() as string;
    console.log('UserID: ', userID);
  
    console.log('Form invalid:', this.signUpForm.invalid); // Debug-Ausgabe

    if (id && userID) { // Überprüfen, ob eventID und userid nicht null ist
      this.signUpForm.patchValue({ eventID: id , userID: userID}); 
      this.eventsService.findOne(id).subscribe(
        (result) => {
          // Hier können Sie die API-Daten anpassen, falls nötig
          this.results = [result]; 
          console.log('Ergebnisse:', this.results); // Debug-Ausgabe
        },
        (error) => {
          this.errorMessage = 'Fehler beim Laden der Eventdaten';
          console.error('Fehler:', error);
        }
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
        }
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
        this.successMessage = 'Sie haben sich erfolgreich für das Event angemeldet!';
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

}
