import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon'; // Korrigierter Import
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true, // Hinzufügen von standalone: true für korrekte Module-Nutzung
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule,
    MatMenuModule,
    MatDividerModule,
    MatIconModule, // Korrigierter Modulname
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  // Implementiere OnInit-Interface korrekt
  private router = inject(Router);
  protected auth = inject(AuthService);
  protected isLoggedIn = this.auth.isAuthenticated();
  protected fullName: string | null = null;

  // Mobile-Menü-Status
  mobileMenuOpen = false;

  ngOnInit() {
    this.fullName = this.auth.getFullName();
  }

  toggleMobileMenu(event?: Event) {
    // Optional: Event stoppen, um unbeabsichtigte Weiterleitungen zu verhindern
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.mobileMenuOpen = !this.mobileMenuOpen;
    const hamburger = document.querySelector('.hamburger');

    if (this.mobileMenuOpen) {
      // Anstatt nur overflow zu setzen, füge eine Klasse hinzu
      document.body.classList.add('menu-open');
      hamburger?.classList.add('active');
    } else {
      document.body.classList.remove('menu-open');
      hamburger?.classList.remove('active');
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    const hamburger = document.querySelector('.hamburger');
    document.body.classList.remove('menu-open');
    hamburger?.classList.remove('active');
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.error('No refresh token found');
      return;
    }

    this.auth.logout(refreshToken).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error logging out:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.router.navigate(['/']);
      },
    });
  }
}
