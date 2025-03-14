import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  imports: [
    MatButtonModule,
    RouterModule,
    MatMenuModule,
    MatDividerModule,
    MatIcon,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  protected auth = inject(AuthService);

  protected isLoggedIn = this.auth.isAuthenticated();

  protected fullName: string | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.fullName = this.auth.getFullName();
  }

  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    const hamburger = document.querySelector('.hamburger');

    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      hamburger?.classList.add('active');
    } else {
      document.body.style.overflow = 'auto';
      hamburger?.classList.remove('active');
    }
  }
  closeMobileMenu() {
    this.mobileMenuOpen = false;
    const hamburger = document.querySelector('.hamburger');
    document.body.style.overflow = 'auto';
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
