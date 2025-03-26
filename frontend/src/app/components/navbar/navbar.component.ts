import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule,
    MatMenuModule,
    MatDividerModule,
    MatIconModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  protected auth = inject(AuthService);
  protected isLoggedIn = this.auth.isAuthenticated();
  protected fullName: string | null = null;

  mobileMenuOpen = false;

  ngOnInit() {
    this.fullName = this.auth.getFullName();
  }

  toggleMobileMenu(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.mobileMenuOpen = !this.mobileMenuOpen;
    const hamburger = document.querySelector('.hamburger');

    if (this.mobileMenuOpen) {
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
