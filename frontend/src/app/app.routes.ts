import type { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './auth/guards/auth.guard';
import { EventsComponent } from './pages/events/id/events.component';
import { SearchComponent } from './pages/search/search.component';
import { CreateEventsComponent } from './pages/events/create/create-events.component';
import { EditEventsComponent } from './pages/events/edit/edit-events.component';
import { profileGuard } from './auth/guards/profile.guard';
import { ProfileIdComponent } from './pages/profile/id/profile-id.component';
import { ErrorHandler, inject } from '@angular/core';
import { AuthService } from './auth/services/auth.service';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'events/create', component: CreateEventsComponent },
  { path: 'events/:id', component: EventsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'search', component: SearchComponent },
  {
    pathMatch: 'prefix',
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: 'events/create', component: CreateEventsComponent },
  {
    path: 'profile',
    component: ProfileIdComponent,
    canActivate: [profileGuard],
    resolve: {
      userId: () => {
        const authService = inject(AuthService);
        return authService.getUserId();
      },
    },
  },
  { path: 'profile/:id', component: ProfileIdComponent },
  {
    path: 'events/:id/edit',
    component: EditEventsComponent,
    canActivate: [authGuard],
  },
];
