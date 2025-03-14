import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { EventsService } from '../../../services/events.service';

interface Event {
  id: number;
  title: string;
  type: string;
  location: string;
  description: string;
  day: string;
  date: string;
  tags: string[];
  image: string;
}

@Component({
  selector: 'app-events',
  imports: [
    RouterModule,
    MatCardModule,
  ],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit{
  event: Event | null = null;
  errorMessage: string = ''; // Fehlernachricht

  constructor(private route: ActivatedRoute, private eventService: EventsService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { // Überprüfen, ob eventID nicht null ist
      this.eventService.getEventById(id).subscribe(
        (data) => {
          // Hier können Sie die API-Daten anpassen, falls nötig
          this.event = {
            id: data.id,
            title: data.title,
            type: data.type,
            location: data.location,
            description: data.description,
            day: data.day,
            date: data.date,
            tags: data.tags,
            image: data.image, // Stellen Sie sicher, dass dies mit der API übereinstimmt
            // Fügen Sie zusätzliche Felder hinzu, falls vorhanden
          };
        },
        (error) => {
          this.errorMessage = 'Fehler beim Laden der Eventdaten';
          console.error('Fehler:', error);
        }
      ); 
    }
  }
}
