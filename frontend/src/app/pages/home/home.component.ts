import { Component } from '@angular/core';
import { EventDiscoveryComponent } from '../../components/event-discovery/event-discovery.component';

@Component({
  selector: 'app-home',
  imports: [EventDiscoveryComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
