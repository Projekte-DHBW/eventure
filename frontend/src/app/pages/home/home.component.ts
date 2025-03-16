import { Component } from '@angular/core';
import { EventDiscoveryComponent } from '../../components/event-discovery/event-discovery.component';
import { EventSliderComponent } from '../../components/event-slider/event-slider.component';

@Component({
  selector: 'app-home',
  imports: [EventDiscoveryComponent, EventSliderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
