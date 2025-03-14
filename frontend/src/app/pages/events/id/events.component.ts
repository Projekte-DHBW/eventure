import { Component, OnInit, Output, EventEmitter} from '@angular/core';
//import { ActivatedRoute } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { EventsSearchResult, EventsService } from '../../../services/events.service';
import { Event } from '../../../types/events';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';



@Component({
  selector: 'app-events',
  imports: [
    RouterModule,
    MatCardModule,
    CommonModule,
    MatBadgeModule,
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit{
  @Output() eventSelected = new EventEmitter<EventsSearchResult | null>();

  searchControl = new FormControl('');
  results: EventsSearchResult[] = [];
  errorMessage: string = ''; // Fehlernachricht

  constructor(private route: ActivatedRoute, private eventsService: EventsService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Extrahierte ID:', id); // Debug-Ausgabe hinzufügen

    if (id) { // Überprüfen, ob eventID nicht null ist
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
}
