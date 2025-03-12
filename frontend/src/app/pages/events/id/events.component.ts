import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

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
  event: any;
  

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const eventID = this.route.snapshot.paramMap.get('id');
    if (eventID) { // Überprüfen, ob eventID nicht null ist
      this.fetchEvent(eventID); 
      console.log(this.event)
    } else {
      console.error('Event ID ist nicht verfügbar');
    } 
  }

  fetchEvent(eventID: string): void {
    this.http.get(`http://localhost:3000/events/${eventID}`)
      .subscribe(data => {
        this.event = data;
      }, error => {
        console.error('Fehler beim Aufrufen des Events:', error);
      });
  }

}
