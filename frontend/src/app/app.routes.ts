import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './auth/guards/auth.guard';
import { EventsComponent } from './pages/events/id/events.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'events/:id', component: EventsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    pathMatch: 'prefix',
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
];
