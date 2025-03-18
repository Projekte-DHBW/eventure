import { Component, OnInit, Output, EventEmitter, inject} from '@angular/core';
//import { ActivatedRoute } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { EventsSearchResult, EventsService } from '../../../services/events.service';
import { Event } from '../../../types/events';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../types/user';

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

  searchControl = new FormControl('');
  results: EventsSearchResult[] = [];

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  users: User[] = [];

  constructor(private route: ActivatedRoute, private eventsService: EventsService) {}

  signUpForm: FormGroup = this.fb.group({
    userID: '',
    eventID: '',
  })


  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');
    console.log('Extrahierte ID:', id); // Debug-Ausgabe hinzufügen

    if (id) { // Überprüfen, ob eventID nicht null ist
      this.signUpForm.patchValue({ eventID: id }); 
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
        this.successMessage = 'Benutzer erfolgreich für das Event angemeldet!';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = 'Fehler beim Einladen des Benutzers: ' + error.message;
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }



}
